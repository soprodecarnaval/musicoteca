import fs from "fs";
import path from "path";
import { ArgumentParser } from "argparse";

import {
  Arrangement,
  CollectionFile,
  Instrument,
  Part,
  Song,
} from "../src/types";

const instrumentNames: Map<string, Instrument> = new Map([
  ["bombardino", "bombardino"],
  ["clarinete", "clarinete"],
  ["clarineta", "clarinete"],
  ["flauta", "flauta"],
  ["flute", "flauta"],
  ["flauta transversal", "flauta"],
  ["alto", "sax alto"],
  ["sax alto", "sax alto"],
  ["alto sax", "sax alto"],
  ["soprano", "sax soprano"],
  ["sax soprano", "sax soprano"],
  ["soprano sax", "sax soprano"],
  ["tenor", "sax tenor"],
  ["sax tenor", "sax tenor"],
  ["tenor sax", "sax tenor"],
  ["trombone", "trombone"],
  ["trombone pirata", "trombone pirata"],
  ["bone", "trombone"],
  ["bone pirata", "trombone pirata"],
  ["trompete", "trompete"],
  ["trumpet", "trompete"],
  ["trompete pirata", "trompete pirata"],
  ["pete", "trompete"],
  ["pete pirata", "trompete pirata"],
  ["tuba", "tuba"],
  ["sousaphone", "tuba"],
]);

const getInstrumentName = (entry: string): Instrument | undefined => {
  let filenameParts = entry
    .split("-")
    .flatMap((part) => part.split("."))
    .map((part) => part.replace("_", " ").toLocaleLowerCase());

  // try to find a match without breaking up the spaces
  let match = filenameParts.find((slice) => instrumentNames.has(slice));
  if (match) {
    return instrumentNames.get(match);
  }

  // otherwise try to break up spaces and find a match
  filenameParts = filenameParts.flatMap((part) => part.split(" "));
  match = filenameParts.find((slice) => instrumentNames.has(slice));

  return match ? instrumentNames.get(match) : undefined;
};

const partFileExtensions = new Set(["pdf", "svg", "jpg", "jpeg", "png"]);

const isPartFileExtension = (extension: string) => {
  return partFileExtensions.has(extension.toLocaleLowerCase());
};

const hasPartFileExtension = (entry: string): boolean => {
  const extension = entry.split(".").pop();
  return extension != undefined && isPartFileExtension(extension);
};

const partFolderNames = new Set(partFileExtensions).add("partes");

const isPartFolderName = (entry: string) => {
  return partFolderNames.has(entry.toLocaleLowerCase());
};

const ignoreEntryPrefixes = new Set([".", "_"]);

type NodeModel =
  | "tag"
  | "song"
  | "arrangement"
  | "partFile"
  | "arrangementFile"
  | "untitledArrangement"
  | "untitledArrangementFile"
  | "untitledArrangementPartFile";

type CollectionFileNode = {
  label: string;
  type: "file";
  model?: NodeModel;
  test?: (name: string) => boolean;
};

type CollectionDirNode = {
  label: string;
  type: "dir";
  model?: NodeModel;
  children: CollectionNode[];
  test?: (name: string) => boolean;
};

type CollectionNode = CollectionFileNode | CollectionDirNode;

type Results = {
  songs: Song[];
  warnings: Warning[];
  songCount: number;
};

type Context = {
  inputPath: string;
  outputPath: string;
  path: string;
  song: Song | null;
  tags: string[];
  arrangement: Arrangement | null;
};

type Warning = {
  source: string;
  context: Context;
  entry: string;
  message: string;
};

const fileSystemStructure: CollectionNode[] = [
  {
    label: "/style/",
    type: "dir",
    model: "tag",
    children: [
      {
        label: "/style/song/",
        type: "dir",
        model: "song",
        children: [
          {
            label: "/style/song/format/",
            type: "dir",
            test: isPartFolderName,
            model: "untitledArrangement",
            children: [
              {
                label: "/style/song/format/part.*",
                type: "file",
                model: "partFile",
              },
            ],
          },
          {
            label: "/style/song/file.*",
            type: "file",
            test: hasPartFileExtension,
            model: "untitledArrangementPartFile",
          },
          {
            label: "/style/song/file.*",
            type: "file",
            model: "untitledArrangementFile",
          },
          {
            label: "/style/song/arrangement/",
            type: "dir",
            // any other string is considered an arrangement
            model: "arrangement",
            children: [
              {
                label: "/style/song/arrangement/format/",
                type: "dir",
                test: isPartFolderName,
                children: [
                  {
                    label: "/style/song/arrangement/format/part.*",
                    type: "file",
                    model: "partFile",
                  },
                ],
              },
              {
                label: "/style/song/arrangement/file.*",
                type: "file",
                model: "arrangementFile",
              },
            ],
          },
        ],
      },
    ],
  },
];

const emptyContext = {
  inputPath: "",
  outputPath: "",
  path: "",
  song: null,
  tags: [],
  arrangement: null,
};

/**
 * Collection reader entry point. Reads the directory, parses the songs and copies
 * the files to the output directory. Returns the collection model.
 */
export const indexCollection = (
  inputPath: string,
  outputPath: string
): Results => {
  const results: Results = {
    songs: [],
    warnings: [],
    songCount: 0,
  };
  const rootContext: Context = {
    ...emptyContext,
    inputPath,
    outputPath,
  };
  readDirectory(fileSystemStructure, inputPath, results, rootContext);
  pruneSongsWithoutArrangements(results);
  return results;
};

/**
 * Sets the directory context path and reads the directory entries.
 * This method does not initialize the model for the directory.
 */
const readDirectory = (
  structure: CollectionNode[],
  outputPath: string,
  results: Results,
  context: Context
): Context => {
  outputPath = path.join(context.path, outputPath);
  console.debug(`[readDirectory] '${outputPath}'`);

  const dirContext = { ...context, path: outputPath };
  fs.readdirSync(outputPath).forEach((entry) => {
    const context = readEntry(structure, entry, results, dirContext);
    dirContext.arrangement = context.arrangement;
    dirContext.song = context.song;
  });

  return dirContext;
};

const doesEntryMatchNode = (
  entry: string,
  node: CollectionNode,
  context: Context
): boolean => {
  const entryPath = path.join(context.path, entry);
  const entryIsDir = fs.statSync(entryPath).isDirectory();
  const nodeIsDir = node.type === "dir";
  console.debug(
    `[doesEntryMatchNode] testing entry '${entry}' against node '${node.label}'`
  );
  if (nodeIsDir != entryIsDir) {
    console.debug(
      `[doesEntryMatchNode] wrong node type (nodeIsDir: ${nodeIsDir}, entryIsDir: ${entryIsDir})`
    );
    return false;
  }
  if (node.test && !node.test(entry)) {
    console.debug(`[doesEntryMatchNode] node test failed`);
    return false;
  }
  console.debug(`[doesEntryMatchNode] matched node`);
  return true;
};

const readEntry = (
  structure: CollectionNode[],
  entry: string,
  results: Results,
  context: Context
): Context => {
  if (ignoreEntryPrefixes.has(entry[0])) {
    console.debug(`[readEntry] Ignoring '${entry}'`);
    return context;
  }
  const node = structure.find((n) => doesEntryMatchNode(entry, n, context));
  if (!node) {
    emitWarning("readEntry", "No node matches entry", entry, results, context);
    return context;
  }
  if (node.type === "file") {
    return readFileEntry(entry, node, results, context);
  } else if (node.type === "dir") {
    return readDirectoryEntry(entry, node, results, context);
  }
  return context;
};

const readFileEntry = (
  entry: string,
  node: CollectionFileNode,
  results: Results,
  context: Context
) => {
  console.debug(`[readFileEntry] '${entry}'`);
  return emitModel(node.model, entry, results, context);
};

const readDirectoryEntry = (
  entry: string,
  node: CollectionDirNode,
  results: Results,
  context: Context
): Context => {
  console.debug(`[readDirectoryEntry] '${entry}'`);

  const entryPath = path.join(context.path, entry);
  if (!fs.statSync(entryPath).isDirectory()) {
    emitWarning(
      "readDirectoryEntry",
      "Entry is not a directory",
      entry,
      results,
      context
    );
    return context;
  }

  const nodeContext = emitModel(node.model, entry, results, context);
  return readDirectory(node.children, entry, results, nodeContext);
};

const emitModel = (
  modelName: NodeModel | undefined,
  entry: string,
  results: Results,
  context: Context
): Context => {
  switch (modelName) {
    case "tag":
      return emitTag(entry, context);
    case "song":
      return emitSong(entry, results, context);
    case "arrangement":
      return emitArrangement(entry, results, context);
    case "partFile":
      return emitPartFile(entry, results, context);
    case "arrangementFile":
      return emitArrangementFile(entry, results, context);
    case "untitledArrangement":
      return emitUntitledArrangement(entry, results, context);
    case "untitledArrangementPartFile":
      return emitUntitledArrangementPartFile(entry, results, context);
    case "untitledArrangementFile":
      return emitUntitledArrangementFile(entry, results, context);
    default:
      return context;
  }
};

const emitTag = (entry: string, context: Context): Context => {
  console.debug(`[emitTag] '${entry}' context: ${inspectContext(context)}'`);
  const tag = entry.toLocaleLowerCase();

  context.tags = [tag];
  return context;
};

const idFromTitle = (title: string): string => {
  return title
    .split(" ")
    .filter((s) => s.length > 0 && s !== "-")
    .join("-")
    .toLocaleLowerCase();
};

const emitSong = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  const title = entry.toLowerCase();
  const song: Song = {
    id: idFromTitle(title),
    type: "song",
    title,
    composer: "",
    sub: "",
    tags: context.tags,
    arrangements: [],
  };
  console.debug(`[emitSong] '${JSON.stringify(song)}'`);
  results.songs.push(song);
  return { ...context, song, arrangement: null };
};

const emitArrangement = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  const name = entry;
  const arrangement: Arrangement = {
    id: idFromTitle(name),
    type: "arrangement",
    name,
    files: [],
    parts: [],
  };
  console.debug(`[emitArrangement] '${arrangement}'`);
  if (!context.song) {
    emitWarning(
      "emitArrangement",
      "Arrangement is not inside an arrangement context",
      entry,
      results,
      context
    );
    return context;
  }
  context.song.arrangements.push(arrangement);
  return { ...context, arrangement };
};

// TODO: add support for parts with more than one file
const emitPartFile = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  if (!context.arrangement) {
    emitWarning(
      "emitPartFile",
      "Part file is not inside an arrangement context",
      entry,
      results,
      context
    );
    return context;
  }

  const name = getInstrumentName(entry);
  if (!name) {
    emitWarning(
      "emitPartFile",
      "Part file does not contain a valid instrument name",
      entry,
      results,
      context
    );
    return context;
  }

  const instrument = instrumentNames.get(name);
  if (!instrument) {
    emitWarning(
      "emitPartFile",
      "Part file does not contain a valid instrument",
      entry,
      results,
      context
    );
    return context;
  }

  const file = emitFile(entry, context);
  if (!file || !isPartFileExtension(file.extension)) {
    emitWarning(
      "emitPartFile",
      `Part file does not contain a valid file extension`,
      entry,
      results,
      context
    );
    return context;
  }

  const part: Part = {
    type: "part",
    name,
    instrument,
    files: [file],
  };
  context.arrangement.parts.push(part);
  return context;
};

const emitArrangementFile = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  if (!context.arrangement) {
    emitWarning(
      "emitArrangementFile",
      "Arrangement file is not inside an arrangement context",
      entry,
      results,
      context
    );
    return context;
  }
  const file = emitFile(entry, context);
  if (!file) {
    emitWarning(
      "emitArrangementFile",
      "Arrangement file is a valid file",
      entry,
      results,
      context
    );
    return context;
  }
  console.debug(`[emitArrangementFile] '${JSON.stringify(file)}'`);
  context.arrangement.files.push(file);
  return context;
};

const emitUntitledArrangement = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  return getOrEmitUntitledArrangement(entry, results, context);
};

const emitUntitledArrangementFile = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  const arrContext = getOrEmitUntitledArrangement(entry, results, context);
  if (!arrContext.arrangement) {
    emitWarning(
      "emitUntitledArrangementFile",
      `Unnamed arrangement file is not inside an arrangement context`,
      entry,
      results,
      context
    );
    return context;
  }

  const file = emitFile(entry, context);
  if (!file) {
    emitWarning(
      "emitUntitledArrangementFile",
      "Unnamed arrangement file is not a valid file",
      entry,
      results,
      context
    );
    return arrContext;
  }
  console.debug(`[emitUntitledArrangementFile] '${JSON.stringify(file)}'`);
  arrContext.arrangement.files.push(file);
  return arrContext;
};

const emitUntitledArrangementPartFile = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  const arrContext = getOrEmitUntitledArrangement(entry, results, context);
  if (!arrContext.arrangement) {
    emitWarning(
      "emitUntitledArrangementPartFile",
      "Unnamed arrangement file is not inside an arrangement context",
      entry,
      results,
      context
    );
    return arrContext;
  }
  const file = emitFile(entry, context);
  if (!file) {
    emitWarning(
      "emitUntitledArrangementPartFile",
      "Arrangement file is a valid file",
      entry,
      results,
      context
    );
    return arrContext;
  }
  console.debug(`[emitUntitledArrangementPartFile] '${JSON.stringify(file)}'`);
  arrContext.arrangement.files.push(file);
  return arrContext;
};

/**
 * Untitled arrangements do not sit inside a directory, so they are not
 * initialized by the directory context. This method initializes the
 * untitled arrangement model if it does not exist.
 */
const getOrEmitUntitledArrangement = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  if (context.arrangement) {
    console.debug(
      `[getOrEmitUntitledArrangement] Found arrangement in context: '${context.arrangement.name}'`
    );
    return context;
  }
  if (!context.song) {
    emitWarning(
      "getOrEmitUntitledArrangement",
      "Unnamed arrangement is not inside a song context",
      entry,
      results,
      context
    );
    return context;
  }

  const title = `${context.song.tags[0]} - ${context.song.title}`;

  const arrangement: Arrangement = {
    id: idFromTitle(title),
    name: title,
    type: "arrangement",
    files: [],
    parts: [],
  };
  console.debug(`[getOrEmitUntitledArrangement] emit '${title}'`);
  context.song.arrangements.push(arrangement);
  return { ...context, arrangement };
};

const inspectContext = (context: Context) => {
  return `path: ${context.path}; song: ${context.song?.title}; arrangement: ${context.arrangement?.name}`;
};

const emitWarning = (
  source: string,
  message: string,
  entry: string,
  results: Results,
  context: Context = emptyContext
) => {
  console.debug(`[${source}] ${message} (${inspectContext(context)})`);
  results.warnings.push({
    source,
    context,
    entry,
    message,
  });
};

// remove spaces and special characters from URLs
// diacriticals are removed (e.g. á -> a)
const normalizeUrl = (url: string): string => {
  return url
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_.]/g, "_")
    .toLocaleLowerCase();
};

const emitFile = (entry: string, context: Context): CollectionFile | null => {
  const extension = entry.split(".").pop();
  if (!extension) {
    return null;
  }

  const entryPath = path.join(context.path, entry);
  const url = normalizeUrl(path.relative(context.inputPath, entryPath));

  // copy file to output
  const outputPath = path.join(context.outputPath, url);
  console.debug(`[emitFile] Copying file '${entryPath}' to '${outputPath}'`);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.copyFileSync(entryPath, outputPath);

  return {
    type: "file",
    url,
    extension,
  };
};

const pruneSongsWithoutArrangements = (results: Results) => {
  results.songs = results.songs.filter((song) => {
    if (song.arrangements.length === 0) {
      emitWarning(
        "pruneSongsWithoutArrangements",
        `Pruning song '${song.title}' because it has no arrangements`,
        song.title,
        results
      );
      return false;
    }
    return true;
  });
};

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

  const input = args["input"];
  if (!input) {
    console.error("ERROR: Input folder is required");
    console.info(argParser.format_help());
    return;
  }

  const output = args["output"];
  if (!output) {
    console.error("ERROR: Output folder is required");
    console.info(argParser.format_help());
    return;
  }

  const verbose = args["verbose"] || false;
  if (!verbose) {
    console.debug = () => {};
  }

  if (fs.existsSync(output)) {
    console.info(`Output folder exists, removing all files inside '${output}'`);
    fs.rmSync(output, { recursive: true });
  }

  fs.mkdirSync(output);

  console.info(`Indexing collection from '${input}' into '${output}'...`);

  const results = indexCollection(input, output);

  const songCount = results.songs.length;
  const arrCount = results.songs.reduce((acc, song) => {
    return acc + song.arrangements.length;
  }, 0);
  console.info(`Indexed ${arrCount} arrangements from ${songCount} songs.`);

  console.info(`Writing index at '${output}/collection.json'...`);
  const songsJson = JSON.stringify({ songs: results.songs }, null, 2);
  fs.writeFileSync(`${output}/collection.json`, songsJson);

  if (results.warnings.length > 0) {
    console.info(
      `Writing ${results.warnings.length} warnings at '${output}/warnings.json'...`
    );
    const warningsJson = JSON.stringify(results.warnings, null, 2);
    fs.writeFileSync(`${output}/warnings.json`, warningsJson);
  }
};

main();
