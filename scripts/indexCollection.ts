import fs from "fs";
import path from "path";
import { ArgumentParser } from "argparse";

import {
  Collection,
  Instrument,
  Project,
  Score,
  zCollection,
  zScore,
} from "../types";
import { Ok, Result, Warning, err, ok, warning } from "../src/result";
import { parseInstrument } from "../src/instrument";
import { output } from "pdfkit";

interface ScoreDirectory {
  absPath: string;
  songTitle: string;
  projectTitle: string;
}

// This method returns a list of score directory paths, attaching
// song title and project title metadata.
// Files are organized as '/project/song/*'
const listScoreDirectories = (inputDir: string): ScoreDirectory[] => {
  const result: ScoreDirectory[] = [];
  for (const projectTitle of fs.readdirSync(inputDir)) {
    const projectDir = path.join(inputDir, projectTitle);
    if (fs.statSync(projectDir).isDirectory()) {
      for (const songTitle of fs.readdirSync(projectDir)) {
        const scoreDir = path.join(projectDir, songTitle);
        if (fs.statSync(scoreDir).isDirectory()) {
          result.push({
            absPath: scoreDir,
            songTitle: songTitle,
            projectTitle: projectTitle,
          });
        }
      }
    }
  }

  return result;
};

const parseInstrumentInEntry = (
  songDirectory: ScoreDirectory,
  entry: string,
  ext: string
): Instrument | undefined => {
  const basename = path.basename(entry, ext);
  // make sure the song title is removed from the basename
  // because there's a song called 'o gato na tuba' that
  // breaks the tuba part
  const withoutSongTitle = basename.replace(songDirectory.songTitle, "");
  return parseInstrument(withoutSongTitle);
};

const scrapeMediaAsset = (
  draft: any,
  songDirectory: ScoreDirectory,
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

const indexScore = (
  scoreDirectory: ScoreDirectory,
  previousCollection?: Collection
): Result<Score> => {
  console.debug(`[scrapeSongDirectory] read ${scoreDirectory.absPath}`);
  let draft: any = {
    id: path.join(scoreDirectory.projectTitle, scoreDirectory.songTitle),
    title: scoreDirectory.songTitle,
    parts: [],
    tags: [],
    projectTitle: scoreDirectory.projectTitle,
  };

  for (const entry of fs.readdirSync(scoreDirectory.absPath)) {
    const ext = path.extname(entry);
    if (ext === ".metajson") {
      draft = { ...draft, ...scrapeMetaJson(scoreDirectory, entry) };
    } else if (ext === ".midi" || ext === ".svg" || ext === ".mscz") {
      scrapeMediaAsset(draft, scoreDirectory, entry, ext);
    }
  }

  // The metajson file of the mscz files from V1 collection
  // do not contain the tags, since the only original tag (style) was derived from the old directory structure.
  // For this reason try to fetch tags from previous collection if that was provided.
  if (draft.tags.length === 0 && previousCollection) {
    const previousSong = previousCollection.projects
      .find((p) => p.title === draft.projectTitle)
      ?.scores.find((s) => s.title === draft.title);

    if (previousSong) {
      draft.tags = previousSong.tags;
    }
  }

  // parse using strict schema and add warnings
  const result = zScore.safeParse(draft);
  if (result.success) {
    return ok(result.data);
  }
  console.log(result.error.errors);
  return err(
    warning("Invalid song", {
      errors: result.error.errors,
      songDirectory: scoreDirectory,
    })
  );
};

const indexProjects = (
  songDirectories: ScoreDirectory[],
  previousCollection?: Collection
): Ok<Project[]> => {
  const projects: Project[] = [];
  const warnings: Warning[] = [];
  for (const songDirectory of songDirectories) {
    const songResult = indexScore(songDirectory, previousCollection);
    if (songResult.ok) {
      const score = songResult.value;
      const projectIdx = projects.findIndex(
        (p) => p.title === songDirectory.projectTitle
      );
      if (projectIdx === -1) {
        projects.push({
          title: songDirectory.projectTitle,
          scores: [score],
        });
      } else {
        projects[projectIdx].scores.push(score);
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
  scoreDirectory: ScoreDirectory,
  entry: string
): MetajsonSongFields | {} {
  const metajson = path.join(scoreDirectory.absPath, entry);
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
    tags: tags?.split(",").map((t: string) => t.trim()) ?? [],
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
  song: Score,
  inputPath: string,
  outputPath: string
): Result<void> {
  const warnings: Warning[] = [];
  const scoreAssets = ["mscz" as const, "metajson" as const, "midi" as const];
  for (const scoreAsset of scoreAssets) {
    const result = copyAsset(song, scoreAsset, inputPath, outputPath);
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
    for (const song of project.scores) {
      copySongAssets(song, inputDir, outputDir);
    }
  }
  const collectionPath = path.join(outputDir, "collection.json");
  fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
  return ok(collection, warnings);
}

const readCollection = (collectionPath: string): Collection => {
  const collectionJson = fs.readFileSync(collectionPath, "utf-8");
  return zCollection.parse(JSON.parse(collectionJson));
};

/**
 * Collection reader entry point. Reads the directory, parses the songs and copies
 * the files to the output directory. Returns the warnings generated in the process.
 */
function indexCollection(
  inputDir: string,
  outputDir: string,
  previousCollection?: Collection
): Warning[] {
  const scoreDirectories = listScoreDirectories(inputDir);
  const { value: projects, warnings: indexScoreDirectoriesWarnings } =
    indexProjects(scoreDirectories, previousCollection);
  const { warnings: writeCollectionWarnings } = writeCollection(
    projects,
    inputDir,
    outputDir
  );
  return [...indexScoreDirectoriesWarnings, ...writeCollectionWarnings];
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
  argParser.add_argument("-p", "--previous-collection", {
    type: "str",
    dest: "previousCollection",
    help: "Previous collection.json, used to copy tag information to the new collection",
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

  let previousCollection: Collection | undefined;
  if (parsedArgs["previousCollection"]) {
    previousCollection = readCollection(
      path.join(outputPath, "collection.json")
    );
  }
  // try to look for the previous collection in the input or output path
  else if (fs.existsSync(path.join(outputPath, "collection.json"))) {
    console.info(
      `Found previous collection at output path, using it to backfill tags.`
    );
    previousCollection = readCollection(
      path.join(outputPath, "collection.json")
    );
  } else if (fs.existsSync(path.join(inputPath, "collection.json"))) {
    console.info(
      `Found previous collection at input path, using it to backfill tags.`
    );
    previousCollection = readCollection(
      path.join(inputPath, "collection.json")
    );
  }

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

  const warnings = indexCollection(inputPath, outputPath, previousCollection);
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
