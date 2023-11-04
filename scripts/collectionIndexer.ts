import fs from "fs";
import path from "path";
import { ArgumentParser } from "argparse";

import {
  Arrangement,
  Collection,
  Instrument,
  Song,
  Tag,
} from "../src/types.js";
import {
  Ok,
  Result,
  Warning,
  err,
  ok,
  keepOk,
  warning,
} from "../src/result.js";

// Each valid file entry corresponds to one arrangement.
// We'll figure the arrangement id from the directory structure.
type Entry = {
  path: string;
  extension: string;
  arrId: string;
  arrName: string;
  songId: string;
  songTitle: string;
  style: string;
};

const instrumentAliases: [string, Instrument][] = [
  ["bombardino", "bombardino"],
  ["clarinete", "clarinete"],
  ["clarineta", "clarinete"],
  ["flauta", "flauta"],
  ["flute", "flauta"],
  ["flauta transversal", "flauta"],
  ["alto", "sax alto"],
  ["sax alto", "sax alto"],
  ["sax alta", "sax alto"],
  ["saxophone alto", "sax alto"],
  ["alto sax", "sax alto"],
  ["soprano", "sax soprano"],
  ["sax soprano", "sax soprano"],
  ["soprano sax", "sax soprano"],
  ["saxophone soprano", "sax soprano"],
  ["tenor", "sax tenor"],
  ["sax tenor", "sax tenor"],
  ["sax ternor", "sax tenor"],
  ["tenor sax", "sax tenor"],
  ["saxophone tenor", "sax tenor"],
  ["trombone", "trombone"],
  ["trombone pirata", "trombone pirata"],
  ["bone", "trombone"],
  ["bone pirata", "trombone pirata"],
  ["trompete", "trompete"],
  ["trumpet", "trompete"],
  ["trompette", "trompete"],
  ["trompete pirata", "trompete pirata"],
  ["pete", "trompete"],
  ["pete pirata", "trompete pirata"],
  ["tuba", "tuba"],
  ["sousaphone", "tuba"],
];

// We will sort them by number of parts descending, so we're sure that
// names with more parts will be matched before their subsets (e.g: 'trompete pirata' < 'trompete')
instrumentAliases.sort(
  (a, b) => a[0].split(" ").length - b[0].split(" ").length
);

/**
 * Drop diacriticals (e.g. á -> a) and replace non-characters with spaces
 */
function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\-_.]/g, " ")
    .toLocaleLowerCase();
}

function idString(...parts: string[]): string {
  return normalizeString(parts.join("-"))
    .replace(/[_ ]/g, "-")
    .replace(/-+/g, "-");
}

function findInstrument(str: string): Instrument | null {
  const normalized = normalizeString(str).replace(/[_\-.]/g, " ");
  const instrument = instrumentAliases.find(([alias, _]) =>
    normalized.includes(alias)
  );
  return instrument ? instrument[1] : null;
}

const partFileExtension = ".svg";
const scoreFileExtension = ".mscz";
const metaFileExtension = ".metajson";
const supportedFileExtensions = new Set([
  partFileExtension,
  scoreFileExtension,
  metaFileExtension,
]);

function endsInExtension(extensions: Set<string>) {
  return (entry: string) => extensions.has(path.extname(entry).toLowerCase());
}

// TODO: handle errors
function listFiles(
  rootPath: string,
  filterFn: (entry: string) => boolean
): string[] {
  return _listFiles(rootPath, rootPath, filterFn);
}

function _listFiles(
  rootPath: string,
  currentPath: string,
  filterFn: (entry: string) => boolean
): string[] {
  const entries = fs.readdirSync(currentPath);
  const result: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(currentPath, entry);
    const relativePath = path.relative(rootPath, entryPath);

    if (fs.statSync(entryPath).isDirectory()) {
      result.push(..._listFiles(rootPath, entryPath, filterFn));
    } else if (filterFn(relativePath)) {
      result.push(relativePath);
    }
  }

  return result;
}

/**
 * Entries are organized in two different file system patterns:
 * - Named arrangements: '/style/song/arrangement/file.*'
 * - Unnamed arrangements: '/style/song/file.*'
 */
function parseEntry(relativePath: string): Result<Entry> {
  console.debug(`[parseEntry] parsing ${relativePath}`);

  const parts = relativePath.split(path.sep);
  if (parts.length != 3 && parts.length != 4) {
    return err(warning(`Unsupported file structure`, { relativePath }));
  }
  const extension = path.extname(relativePath).toLowerCase();
  const style = parts[0].trim().toLocaleLowerCase();
  const songTitle = parts[1].trim().toLocaleLowerCase();
  const songId = idString(style, songTitle);
  const arrName =
    parts.length == 3 ? style : parts[2].trim().toLocaleLowerCase();
  const arrId = idString(style, songTitle, arrName);
  const entry = {
    path: relativePath,
    extension,
    arrId,
    arrName,
    songId,
    songTitle,
    style,
  };
  console.debug(`[parseEntry] got ${JSON.stringify(entry)}`);
  return ok(entry);
}

/**
 * Goes through all the entries and creates a Song and Arrangement model for each
 * score file, then adds the part files to the corresponding arrangement.
 * There are no blocking errors here, but we do generate some warnings.
 */
function indexEntries(entries: Entry[]): Ok<Collection> {
  const warnings: Warning[] = [];

  // Create Song and Arrangement models from each score file, using the directory structure
  // to infer the song and arrangement names. If the arrangement name is not present, we
  // use the style name instead.
  const arrangements: { [id: string]: Arrangement } = {};
  const songs: { [id: string]: Song } = {};
  const tagSet: Set<Tag> = new Set();

  entries
    .filter((entry) => entry.extension.endsWith(scoreFileExtension))
    .forEach((entry) => {
      console.debug(`[parseCollection] indexing entry ${entry}`);

      const { arrId, arrName, songId, songTitle, style } = entry;
      const arr: Arrangement = {
        id: arrId,
        files: [],
        name: arrName,
        parts: [],
        tags: [style],
        songId: songId,
      };

      if (arrId in arrangements) {
        warnings.push(
          warning(
            `Duplicate arrangement ${arrId} for song ${songId} (${songTitle})`,
            entry
          )
        );
        return;
      }
      arrangements[arrId] = arr;

      if (songs[songId]) {
        const song = songs[songId];
        song.arrangementIds.push(arrId);
        console.debug(
          `[parseCollection] added arrangement ${arrId} to song ${songId}`
        );
      } else {
        songs[songId] = {
          id: songId,
          title: songTitle,
          composer: "", // TODO: get from .metajson
          sub: "",
          arrangementIds: [arrId],
          style,
        };
        console.debug(
          `[parseCollection] created song ${songId} with arrangement ${arrId}`
        );
      }
    });

  // Add part files to the corresponding arrangements
  entries
    .filter((entry) => entry.extension.endsWith(partFileExtension))
    .forEach((entry) => {
      console.debug(`[parseCollection] adding part ${entry}`);
      const arr = arrangements[entry.arrId];
      if (!arr) {
        warnings.push(
          warning(`No arrangement found for ${entry.arrId}`, entry)
        );
        return;
      }

      const instrument = findInstrument(entry.path);
      if (!instrument) {
        warnings.push(warning(`No instrument found for ${entry.path}`, entry));
        return;
      }

      arr.parts.push({
        name: instrument, // TODO: get from .metajson
        instrument,
        files: [
          {
            path: entry.path,
            extension: entry.extension,
          },
        ],
      });
    });

  const tags = Array.from(tagSet.values());
  const collection = {
    arrangements,
    songs,
    tags,
  };

  return ok(collection, warnings);
}

/**
 * Emits the song collection index and assets to the output directory.
 * This method will update the collection paths according to the
 * output directory structure:
 * '/style/song/arrangement/file.*'
 */
function emitCollection(
  coll: Collection,
  inputPath: string,
  outputPath: string
): Ok<number> {
  // copy files
  let assetFileCount = 0;
  for (const songId in coll.songs) {
    const song = coll.songs[songId];
    const songPath = path.join(song.style, song.title);
    const absSongPath = path.join(outputPath, songPath);
    fs.mkdirSync(absSongPath, { recursive: true });

    for (const arrId of song.arrangementIds) {
      const arr = coll.arrangements[arrId];
      const arrPath = path.join(songPath, arr.name);
      const absArrPath = path.join(outputPath, arrPath);
      fs.mkdirSync(absArrPath, { recursive: true });

      for (const afIdx in arr.files) {
        const arrFile = arr.files[afIdx];
        const srcArrFilePath = path.join(inputPath, arrFile.path);
        const dstArrFilePath = path.join(arrPath, arr.name + arrFile.extension);
        const absDstArrFilePath = path.join(outputPath, dstArrFilePath);

        console.debug(
          `[writeCollection] copying ${srcArrFilePath} to ${dstArrFilePath}`
        );
        fs.copyFileSync(srcArrFilePath, absDstArrFilePath);

        // update arrFile path in collection
        coll.arrangements[arrId].files[afIdx].path = dstArrFilePath;

        assetFileCount++;
      }

      for (const pIdx in arr.parts) {
        const part = arr.parts[pIdx];

        for (const pfIdx in part.files) {
          const partFile = part.files[pfIdx];
          const srcPartFilePath = path.join(inputPath, partFile.path);
          const dstPartFilePath =
            path.join(arrPath, part.name) + partFile.extension;

          const absDstPartFilePath = path.join(outputPath, dstPartFilePath);

          console.debug(
            `[writeCollection] copying ${srcPartFilePath} to ${absDstPartFilePath}`
          );
          fs.copyFileSync(srcPartFilePath, absDstPartFilePath);

          // update partFile path in collection
          coll.arrangements[arrId].parts[pIdx].files[pfIdx].path =
            dstPartFilePath;

          assetFileCount++;
        }
      }
    }
  }

  // write index
  const indexPath = path.join(outputPath, "collection.json");
  console.info(`Writing collection index at '${indexPath}'...`);
  const songsJson = JSON.stringify(coll, null, 2);
  fs.writeFileSync(indexPath, songsJson);
  console.info(`Wrote ${assetFileCount} collection asset files`);

  return ok(assetFileCount, []);
}

/**
 * Collection reader entry point. Reads the directory, parses the songs and copies
 * the files to the output directory. Returns the warnings generated in the process.
 */
function indexCollection(inputPath: string, outputPath: string): Warning[] {
  const files = listFiles(inputPath, endsInExtension(supportedFileExtensions));
  const { value: entries, warnings: parseEntryWarnings } = keepOk(
    files.map(parseEntry)
  );
  const { value: collection, warnings: parseCollectionWarnings } =
    indexEntries(entries);
  const { warnings: writeCollectionWarnings } = emitCollection(
    collection,
    inputPath,
    outputPath
  );
  return [
    ...parseEntryWarnings,
    ...parseCollectionWarnings,
    ...writeCollectionWarnings,
  ];
}

const main = () => {
  const argParser = new ArgumentParser({
    description:
      "Reads a score collection from a folder, copies the valid files over to the output folder and generates an index file.",
  });

  argParser.add_argument("-i", "--input", {
    type: "str",
    dest: "input",
    help: "Input folder",
  });
  argParser.add_argument("-o", "--output", {
    type: "str",
    dest: "output",
    help: "Output folder",
  });
  argParser.add_argument("-v", "--verbose", {
    dest: "verbose",
    action: "store_true",
    help: "Verbose mode",
  });

  const args = argParser.parse_args();

  let inputPath = args["input"];
  if (!inputPath) {
    console.error("ERROR: Input folder is required");
    console.info(argParser.format_help());
    return;
  }
  inputPath = path.resolve(inputPath);

  let outputPath = args["output"];
  if (!outputPath) {
    console.error("ERROR: Output folder is required");
    console.info(argParser.format_help());
    return;
  }
  outputPath = path.resolve(outputPath);

  const verbose = args["verbose"] || false;
  if (!verbose) {
    console.debug = () => {};
  }

  if (fs.existsSync(outputPath)) {
    console.info(
      `Output folder exists, removing all files inside '${outputPath}'`
    );
    fs.rmSync(outputPath, { recursive: true });
  }

  fs.mkdirSync(outputPath);

  console.info(
    `Indexing collection from '${inputPath}' into '${outputPath}'...`
  );

  const warnings = indexCollection(inputPath, outputPath);
  if (warnings.length > 0) {
    console.info(
      `Writing ${warnings.length} warnings at '${outputPath}/warnings.json'...`
    );
    fs.writeFileSync(
      path.join(outputPath, "warnings.json"),
      JSON.stringify(warnings, null, 2)
    );
  }
};

main();
