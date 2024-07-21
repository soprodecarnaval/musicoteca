import fs from "fs";
import path from "path";
import { ArgumentParser } from "argparse";

import { Collection, Instrument, Project, Song, zSong } from "../types";
import { Ok, Result, Warning, err, ok, warning } from "../src/result";
import { parseInstrument } from "../src/instrument";

interface SongDirectory {
  absPath: string;
  song: string;
  project: string;
}

// This method returns a list of song directory paths, attaching
// song title and project title metadata.
// Files are organized as '/project/song/*'
const listSongDirectories = (inputDir: string): SongDirectory[] => {
  const result: SongDirectory[] = [];
  for (const project of fs.readdirSync(inputDir)) {
    const projectDir = path.join(inputDir, project);
    if (fs.statSync(projectDir).isDirectory()) {
      for (const song of fs.readdirSync(projectDir)) {
        const songDir = path.join(projectDir, song);
        if (fs.statSync(songDir).isDirectory()) {
          result.push({
            absPath: songDir,
            song,
            project,
          });
        }
      }
    }
  }

  return result;
};

const parseInstrumentInEntry = (
  songDirectory: SongDirectory,
  entry: string,
  ext: string
): Instrument | undefined => {
  const basename = path.basename(entry, ext);
  // make sure the song title is removed from the basename
  // because there's a song called 'o gato na tuba' that
  // breaks the tuba part
  const withoutSongTitle = basename.replace(songDirectory.song, "");
  return parseInstrument(withoutSongTitle);
};

const scrapeMediaAsset = (
  draft: any,
  songDirectory: SongDirectory,
  entry: string,
  ext: string
) => {
  const instrument = parseInstrumentInEntry(songDirectory, entry, ext);
  const entryPath = path.join(songDirectory.absPath, entry);
  const field = ext.replace(".", "");
  if (instrument) {
    // part asset
    const name = path.basename(entry, ext);
    const partIdx = draft.parts.findIndex((p: any) => p.name === name);
    if (partIdx === -1) {
      draft.parts.push({
        name,
        instrument,
        [field]: entryPath,
      });
    } else {
      draft.parts[partIdx][field] = entryPath;
    }
  } else {
    // regular asset
    draft[field] = entryPath;
  }
};

const indexSong = (songDirectory: SongDirectory): Result<Song> => {
  console.debug(`[scrapeSongDirectory] read ${songDirectory.absPath}`);
  let draft: any = {
    title: songDirectory.song,
    parts: [],
    tags: [],
  };

  for (const entry of fs.readdirSync(songDirectory.absPath)) {
    const ext = path.extname(entry);
    if (ext === ".metajson") {
      draft = { ...draft, ...scrapeMetaJson(songDirectory, entry) };
    } else if (ext === ".midi" || ext === ".svg" || ext === ".mscz") {
      scrapeMediaAsset(draft, songDirectory, entry, ext);
    }
  }
  // parse using strict schema and add warnings
  const result = zSong.safeParse(draft);
  if (result.success) {
    return ok(result.data);
  }
  console.log(result.error.errors);
  return err(
    warning("Invalid song", {
      errors: result.error.errors,
      songDirectory,
    })
  );
};

const indexProjects = (songDirectories: SongDirectory[]): Ok<Project[]> => {
  const projects: Project[] = [];
  const warnings: Warning[] = [];
  for (const songDirectory of songDirectories) {
    const songResult = indexSong(songDirectory);
    if (songResult.ok) {
      const song = songResult.value;
      const projectIdx = projects.findIndex(
        (p) => p.title === songDirectory.project
      );
      if (projectIdx === -1) {
        projects.push({
          title: songDirectory.project,
          songs: [song],
        });
      } else {
        projects[projectIdx].songs.push(song);
      }
    } else {
      warnings.push(...songResult.warnings);
    }
  }
  return ok(projects, warnings);
};

function readJsonFile(absPath: string): Result<any> {
  console.debug(`[readJsonAsset] reading ${absPath}`);
  if (!fs.existsSync(absPath)) {
    return err(warning(`No json file found`, { absPath }));
  }
  const json = fs.readFileSync(absPath, "utf-8");
  try {
    return ok(JSON.parse(json));
  } catch (e) {
    return err(warning(`Invalid json file`, { absPath }));
  }
}

type MetajsonSongFields = {
  composer: string;
  sub: string;
  metajson: string;
  tags?: string[];
};

/**
 * The composer and sub field are extracted from the mscz.
 */
function scrapeMetaJson(
  songDirectory: SongDirectory,
  entry: string
): MetajsonSongFields | {} {
  const metajson = path.join(songDirectory.absPath, entry);
  const readMetaJsonResult = readJsonFile(metajson);
  if (!readMetaJsonResult.ok) {
    return {};
  }

  // some mscz files have lyrics in the previousSource field,
  // we will just use it if there's no lyrics field
  const { composer, previousSource, lyrics, tags } = readMetaJsonResult.value;
  return {
    composer,
    sub: lyrics ? lyrics : previousSource,
    metajson,
    tags: tags.split(",").map((t: string) => t.trim()),
  };
}

// copies the asset from the inputPath to the outputPath
// and sets the relative path in the object
function copyAsset<K extends string>(
  obj: Record<K, string>,
  key: K,
  inputPath: string,
  outputPath: string
): Result<void> {
  const inputAbsPath = obj[key];
  if (inputAbsPath) {
    const relPath = path.relative(inputPath, inputAbsPath);
    const outputAbsPath = path.join(outputPath, relPath);
    const outputDirname = path.dirname(outputAbsPath);
    if (!fs.existsSync(outputDirname)) {
      fs.mkdirSync(outputDirname, { recursive: true });
    }
    fs.copyFileSync(inputAbsPath, outputAbsPath);
    obj[key] = relPath;
  }
  return ok(undefined);
}

function copySongAssets(
  song: Song,
  inputPath: string,
  outputPath: string
): Result<void> {
  const warnings: Warning[] = [];
  const songAssets = ["mscz" as const, "metajson" as const, "midi" as const];
  for (const songAsset of songAssets) {
    const result = copyAsset(song, songAsset, inputPath, outputPath);
    if (!result.ok) {
      warnings.push(...result.warnings);
    }
  }
  for (const part of song.parts) {
    const partAssets = ["svg" as const, "midi" as const];
    for (const partAsset of partAssets) {
      const result = copyAsset(part, partAsset, inputPath, outputPath);
      if (!result.ok) {
        warnings.push(...result.warnings);
      }
    }
  }
  return ok(undefined, warnings);
}

/**
 * Writes the collection to the output directory and copies the files over.
 */
function writeCollection(
  projects: Project[],
  inputDir: string,
  outputDir: string
): Ok<Collection> {
  const collection: Collection = {
    projects,
    scrapedAt: new Date(),
    version: 2,
  };
  const warnings: Warning[] = [];
  for (const project of projects) {
    for (const song of project.songs) {
      copySongAssets(song, inputDir, outputDir);
    }
  }
  const collectionPath = path.join(outputDir, "collection.json");
  fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
  return ok(collection, warnings);
}

/**
 * Collection reader entry point. Reads the directory, parses the songs and copies
 * the files to the output directory. Returns the warnings generated in the process.
 */
function indexCollection(inputDir: string, outputDir: string): Warning[] {
  const songDirectories = listSongDirectories(inputDir);
  const { value: projects, warnings: indexSongDirectoriesWarnings } =
    indexProjects(songDirectories);
  const { warnings: writeCollectionWarnings } = writeCollection(
    projects,
    inputDir,
    outputDir
  );
  return [...indexSongDirectoriesWarnings, ...writeCollectionWarnings];
}

const run = async (args: string[]) => {
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

  const parsedArgs = argParser.parse_args(args);

  let inputPath = parsedArgs["input"];
  if (!inputPath) {
    console.error("ERROR: Input folder is required");
    console.info(argParser.format_help());
    return;
  }
  inputPath = path.resolve(inputPath);

  let outputPath = parsedArgs["output"];
  if (!outputPath) {
    console.error("ERROR: Output folder is required");
    console.info(argParser.format_help());
    return;
  }
  outputPath = path.resolve(outputPath);

  const verbose = parsedArgs["verbose"] || false;
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

export default run;
