import fs from "fs";
import path from "path";
import { ArgumentParser } from "argparse";

import {
  Collection,
  Instrument,
  Part,
  Song,
  Tag,
  Asset,
  Arrangement,
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
  absPath: string;
  relPath: string;
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

// Draft types used internally to index the collection
type CollectionDraft = {
  arrMap: { [id: string]: ArrangementDraft };
  songMap: { [id: string]: SongDraft };
  tagSet: Set<Tag>;
  warnings: Warning[];
};

type SongDraft = {
  id: string;
  title: string;
  composer: string;
  sub: string;
  arrangementIds: string[];
  style: Tag;
};

type ArrangementDraft = {
  id: string;
  files: Asset[];
  name: string;
  parts: Part[];
  tags: Tag[];
  songId: string;
};

type ScoreMetadata = {
  composer: string;
};

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

const partAssetExtensions = [".svg", ".midi"];
const scoreAssetExtension = ".mscz";
const metaFileExtension = ".metajson";
const supportedFileExtensions = new Set([
  ...partAssetExtensions,
  scoreAssetExtension,
  metaFileExtension,
]);

function endsInExtension(extensions: Set<string>) {
  return (entry: string) => extensions.has(path.extname(entry).toLowerCase());
}

function listFilePaths(
  currentPath: string,
  filterFn: (entry: string) => boolean
): string[] {
  const entries = fs.readdirSync(currentPath);
  const result: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(currentPath, entry);

    if (fs.statSync(entryPath).isDirectory()) {
      result.push(...listFilePaths(entryPath, filterFn));
    } else if (filterFn(entryPath)) {
      result.push(entryPath);
    }
  }

  return result;
}

/**
 * Entries are organized in two different file system patterns:
 * - Named arrangements: '/style/song/arrangement/asset.*'
 * - Unnamed arrangements: '/style/song/asset.*'
 */
function parseEntry(absPath: string, rootPath: string): Result<Entry> {
  console.debug(`[parseEntry] parsing ${absPath}`);

  const relPath = path.relative(rootPath, absPath);
  const parts = relPath.split(path.sep);
  if (parts.length != 3 && parts.length != 4) {
    return err(warning(`Unsupported file structure`, { relPath }));
  }
  const extension = path.extname(relPath).toLowerCase();
  const style = parts[0].trim().toLocaleLowerCase();
  const songTitle = parts[1].trim().toLocaleLowerCase();
  const songId = idString(style, songTitle);
  const arrName =
    parts.length == 3 ? style : parts[2].trim().toLocaleLowerCase();
  const arrId = idString(style, songTitle, arrName);
  const entry = {
    absPath,
    relPath,
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
 * score asset, then adds the part assets to the corresponding arrangement.
 * There are no blocking errors here, but we do generate some warnings.
 */
function indexEntries(entries: Entry[]): Ok<Collection> {
  const collDraft: CollectionDraft = {
    arrMap: {},
    songMap: {},
    tagSet: new Set(),
    warnings: [],
  };

  // Create Song and Arrangement models from each score asset, using the directory structure
  // to infer the song and arrangement names. If the arrangement name is not present, we
  // use the style name instead.
  entries
    .filter((entry) => entry.extension.endsWith(scoreAssetExtension))
    .forEach((entry) => indexScoreAsset(entry, collDraft));

  entries
    .filter((entry) =>
      partAssetExtensions.some((ext) => entry.extension.endsWith(ext))
    )
    .forEach((entry) => indexPartAsset(entry, collDraft));

  const coll = renderCollectionDraft(collDraft);
  return ok(coll, collDraft.warnings);
}

function renderCollectionDraft(collDraft: CollectionDraft): Collection {
  const { arrMap, songMap, tagSet } = collDraft;
  const tags = Array.from(tagSet.values());
  const songs: Song[] = Object.values(songMap).map((songDraft) => {
    const songArrs = songDraft.arrangementIds.map((arrangementId) => {
      return renderArrangementDraft(arrMap[arrangementId]);
    });
    return renderSongDraft(songDraft, songArrs);
  });

  return {
    songs,
    tags,
  };
}

function renderSongDraft(
  songDraft: SongDraft,
  arrangements: Arrangement[]
): Song {
  const { id, title, composer, sub, style } = songDraft;
  return {
    id,
    title,
    composer,
    sub,
    arrangements,
    style,
  };
}

function renderArrangementDraft(arrDraft: ArrangementDraft): Arrangement {
  const { id, name, files, parts, tags } = arrDraft;
  return { id, name, assets: files, parts, tags };
}

// TODO: handle errors
function readScoreMetajson(scoreEntry: Entry): ScoreMetadata {
  // open .metajson file, which should have the same filename as the score
  const metajsonPath = scoreEntry.absPath.replace(
    scoreEntry.extension,
    metaFileExtension
  );
  console.debug(`[readScoreMetajson] reading ${metajsonPath}`);
  const metaJson = fs.readFileSync(metajsonPath, "utf-8");
  const meta = JSON.parse(metaJson);
  return {
    composer: meta.composer,
  };
}

function indexScoreAsset(entry: Entry, collDraft: CollectionDraft) {
  const { arrMap, songMap, warnings } = collDraft;
  console.debug(`[_indexScoreFileEntry] indexing entry ${entry}`);

  const { arrId, arrName, songId, songTitle, style } = entry;
  const arr: ArrangementDraft = {
    id: arrId,
    files: [],
    name: arrName,
    parts: [],
    tags: [style],
    songId: songId,
  };

  if (arrId in arrMap) {
    warnings.push(
      warning(
        `Duplicate arrangement ${arrId} for song ${songId} (${songTitle})`,
        entry
      )
    );
    return;
  }
  arrMap[arrId] = arr;

  if (songMap[songId]) {
    const song = songMap[songId];
    song.arrangementIds.push(arrId);
    console.debug(
      `[indexScoreFileEntry] added arrangement ${arrId} to song ${songId}`
    );
  } else {
    const scoreMetadata = readScoreMetajson(entry);
    songMap[songId] = {
      id: songId,
      title: songTitle,
      composer: scoreMetadata.composer,
      sub: "", // TODO: figure out a way to read this
      arrangementIds: [arrId],
      style,
    };
    console.debug(
      `[indexScoreFileEntry] created song ${songId} with arrangement ${arrId}`
    );
  }
}

function indexPartAsset(entry: Entry, collDraft: CollectionDraft) {
  console.debug(`[indexPartAssetEntry] adding part ${entry}`);
  const arr = collDraft.arrMap[entry.arrId];
  if (!arr) {
    collDraft.warnings.push(
      warning(`No arrangement found for ${entry.arrId}`, entry)
    );
    return;
  }

  const instrument = findInstrument(entry.relPath);
  if (!instrument) {
    collDraft.warnings.push(
      warning(`No instrument found for ${entry.relPath}`, entry)
    );
    return;
  }

  arr.parts.push({
    name: instrument, // TODO: get from .metajson
    instrument,
    assets: [
      {
        path: entry.relPath,
        extension: entry.extension,
      },
    ],
  });
}

/**
 * Emits the song collection index and assets to the output directory.
 * This method will update the collection paths according to the
 * output directory structure:
 * '/style/song/arrangement/asset.*'
 */
function emitCollection(
  coll: Collection,
  inputPath: string,
  outputPath: string
): Ok<Collection> {
  // copy files
  let assetFileCount = 0;
  for (const s in coll.songs) {
    const song = coll.songs[s];
    const songPath = path.join(song.style, song.title);
    const absSongPath = path.join(outputPath, songPath);
    fs.mkdirSync(absSongPath, { recursive: true });

    for (const a in song.arrangements) {
      const arr = song.arrangements[a];
      const arrPath = path.join(songPath, arr.name);
      const absArrPath = path.join(outputPath, arrPath);
      fs.mkdirSync(absArrPath, { recursive: true });

      for (const ass in arr.assets) {
        const arrFile = arr.assets[ass];
        const srcArrFilePath = path.join(inputPath, arrFile.path);
        const dstArrFilePath = path.join(arrPath, arr.name + arrFile.extension);
        const absDstArrFilePath = path.join(outputPath, dstArrFilePath);

        console.debug(
          `[writeCollection] copying ${srcArrFilePath} to ${dstArrFilePath}`
        );
        fs.copyFileSync(srcArrFilePath, absDstArrFilePath);

        // update arrFile path in collection
        coll.songs[s].arrangements[a].assets[ass].path = dstArrFilePath;

        assetFileCount++;
      }

      for (const p in arr.parts) {
        const part = arr.parts[p];

        for (const ass in part.assets) {
          const partAsset = part.assets[ass];
          const srcPartAssetPath = path.join(inputPath, partAsset.path);
          const dstPartAssetPath =
            path.join(arrPath, part.name) + partAsset.extension;

          const absDstPartAssetPath = path.join(outputPath, dstPartAssetPath);

          console.debug(
            `[writeCollection] copying ${srcPartAssetPath} to ${absDstPartAssetPath}`
          );
          fs.copyFileSync(srcPartAssetPath, absDstPartAssetPath);

          // update partAsset path in collection
          coll.songs[s].arrangements[a].parts[p].assets[ass].path =
            dstPartAssetPath;

          assetFileCount++;
        }
      }
    }
  }

  // write collection
  const indexPath = path.join(outputPath, "collection.json");
  console.info(`Writing collection index at '${indexPath}'...`);
  const collJson = JSON.stringify(coll, null, 2);
  fs.writeFileSync(indexPath, collJson);
  console.info(`Wrote ${assetFileCount} collection asset files`);

  return ok(coll, []);
}

/**
 * Collection reader entry point. Reads the directory, parses the songs and copies
 * the files to the output directory. Returns the warnings generated in the process.
 */
function indexCollection(inputPath: string, outputPath: string): Warning[] {
  const filePaths = listFilePaths(
    inputPath,
    endsInExtension(supportedFileExtensions)
  );
  const { value: entries, warnings: parseEntryWarnings } = keepOk(
    filePaths.map((fp) => parseEntry(fp, inputPath))
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
