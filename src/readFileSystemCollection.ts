import fs from "fs";
import { Arrangement, CollectionFile, Instrument, Part, Song } from "./types";

const instrumentNames: Map<string, Instrument> = new Map([
  ["bombardino", "bombardino"],
  ["clarinete", "clarinete"],
  ["flauta", "flauta"],
  ["sax alto", "sax alto"],
  ["sax soprano", "sax soprano"],
  ["sax tenor", "sax tenor"],
  ["trombone", "trombone"],
  ["bone", "trombone"],
  ["trompete", "trompete"],
  ["pete", "trompete"],
  ["tuba", "tuba"],
]);

const partFileExtensions = new Set(["pdf", "svg", "jpg", "jpeg", "png"]);

const isPartFileExtension = (extension: string) => {
  return extension.toLocaleLowerCase() in partFileExtensions;
};

const ignoreEntryPrefixes = new Set([".", "_"]);

type NodeModel =
  | "tag"
  | "song"
  | "arrangement"
  | "partFile"
  | "arrangementFile"
  | "untitledArrangement"
  | "untitledArrangementFile";

type CollectionFileNode = {
  type: "file";
  model?: NodeModel;
  test?: (name: string) => boolean;
};

type CollectionDirNode = {
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
  arrangementCount: number;
};

type Context = {
  path: string;
  song: Song | null;
  arrangement: Arrangement | null;
};

type Warning = {
  context: Context;
  entry: string;
  message: string;
};

const fileSystemStructure: CollectionNode[] = [
  // /style/
  {
    type: "dir",
    model: "tag",
    children: [
      {
        // /style/song/
        type: "dir",
        model: "song",
        children: [
          {
            // /style/song/format/
            type: "dir",
            test: isPartFileExtension,
            model: "untitledArrangement",
            children: [
              {
                // /style/song/format/part.*
                type: "file",
                model: "partFile",
              },
            ],
          },
          {
            // /style/song/file.*
            type: "file",
            model: "untitledArrangementFile",
          },
          {
            // /style/song/arrangement/
            type: "dir",
            // any other string is considered an arrangement
            model: "arrangement",
            children: [
              {
                // /style/song/arrangement/format/
                type: "dir",
                test: isPartFileExtension,
                children: [
                  {
                    // /style/song/arrangement/format/part.*
                    type: "file",
                    model: "partFile",
                  },
                ],
              },
              {
                // /style/song/arrangement/file.*
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

/**
 * Collection reader entry point. Reads the directory and parses the songs.
 */
export const readFileSystemCollection = (path: string): Results => {
  const results: Results = {
    songs: [],
    warnings: [],
    arrangementCount: 0,
    songCount: 0,
  };
  const rootContext: Context = {
    path: ".",
    song: null,
    arrangement: null,
  };
  readDirectory(fileSystemStructure, path, results, rootContext);
  return results;
};

/**
 * Sets the directory context path and reads the directory entries.
 * This method does not initialize the model for the directory.
 */
const readDirectory = (
  structure: CollectionNode[],
  path: string,
  results: Results,
  context: Context
): Results => {
  path = `${context.path}/${path}`;
  console.log(`[readDirectory] '${path}'`);

  const dirContext = { ...context, path };
  fs.readdirSync(path).forEach((entryPath) => {
    const entry = `${path}/${entryPath}`;
    readEntry(structure, entry, results, dirContext);
  });

  return results;
};

const doesEntryMatchNode = (entry: string, node: CollectionNode): boolean => {
  if (node.type === "dir" && !fs.statSync(entry).isDirectory()) {
    return false;
  }
  if (node.test) {
    return node.test(entry);
  }
  return true;
};

const readEntry = (
  structure: CollectionNode[],
  entry: string,
  results: Results,
  context: Context
) => {
  if (ignoreEntryPrefixes.has(entry[0])) {
    console.log(`[readEntry] Ignoring '${entry}'`);
    return;
  }
  const node = structure.find((node) => doesEntryMatchNode(entry, node));
  if (!node) {
    const message = `No node matches entry '${entry}'`;
    console.warn(`[readEntry] ${message}`, context);
    results.warnings.push({
      context,
      entry,
      message,
    });
    return;
  }
  if (node.type === "file") {
    readFileEntry(entry, node, results, context);
  } else if (node.type === "dir") {
    readDirectoryEntry(entry, node, results, context);
  }
};

const readFileEntry = (
  entry: string,
  node: CollectionFileNode,
  results: Results,
  context: Context
) => {
  console.log(`[readFileEntry] '${entry}'`);
  emitModel(node.model, entry, results, context);
};

const readDirectoryEntry = (
  entry: string,
  node: CollectionDirNode,
  results: Results,
  context: Context
) => {
  console.log(`[readDirectoryEntry] '${entry}'`);

  if (!fs.statSync(entry).isDirectory()) {
    emitWarning(
      `[readDirectoryEntry] Directory entry '${entry}' is not a directory`,
      entry,
      results,
      context
    );
    return;
  }

  const nodeContext = emitModel(node.model, entry, results, context);
  readDirectory(node.children, entry, results, nodeContext);
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
    case "untitledArrangementFile":
      return emitUntitledArrangementFile(entry, results, context);
    default:
      return context;
  }
};

const emitTag = (entry: string, context: Context): Context => {
  const tag = entry.toLocaleLowerCase();
  context.song!.tags.push(tag);
  return context;
};

const emitSong = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  const song: Song = {
    id: results.songCount++,
    type: "song",
    title: entry.toLowerCase(),
    composer: "",
    sub: "",
    tags: [],
    arrangements: [],
  };
  console.log(`[emitSong] '${song}'`);
  results.songs.push(song);
  return { ...context, song };
};

const emitArrangement = (
  entry: string,
  results: Results,
  context: Context
): Context => {
  const arrangement: Arrangement = {
    id: results.arrangementCount++,
    type: "arrangement",
    name: entry,
    files: [],
    parts: [],
  };
  console.log(`[emitArrangement] '${arrangement}'`);
  if (!context.song) {
    emitWarning(
      `[emitArrangement] Arrangement '${entry}' is not inside an arrangement context`,
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
      `[emitPartFile] Part file '${entry}' is not inside an arrangement context`,
      entry,
      results,
      context
    );
    return context;
  }

  const filenameParts = entry
    .split("-")
    .map((part) => part.replace("_", " ").toLocaleLowerCase());
  const name = filenameParts.find(instrumentNames.has);
  if (!name) {
    emitWarning(
      `[emitPartFile] Part file '${entry}' does not contain a valid instrument name`,
      entry,
      results,
      context
    );
    return context;
  }

  const instrument = instrumentNames.get(name);
  if (!instrument) {
    emitWarning(
      `[emitPartFile] Part file '${entry}' does not contain a valid instrument`,
      entry,
      results,
      context
    );
    return context;
  }

  const file = getFile(entry, context);
  if (!file || !isPartFileExtension(file.extension)) {
    emitWarning(
      `[emitPartFile] Part file '${entry}' does not contain a valid file extension`,
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
  console.log(`[emitPartFile] '${part}'`);
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
      `[emitArrangementFile] Arrangement file '${entry}' is not inside an arrangement context`,
      entry,
      results,
      context
    );
    return context;
  }
  const file = getFile(entry, context);
  if (!file) {
    emitWarning(
      `[emitArrangementFile] Arrangement file '${entry}' is a valid file`,
      entry,
      results,
      context
    );
    return context;
  }
  console.log(`[emitArrangementFile] '${file}'`);
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
      `[emitUntitledArrangementFile] Unnamed arrangement file '${entry}' is not inside an arrangement context`,
      entry,
      results,
      context
    );
    return context;
  }

  const file = getFile(entry, context);
  if (!file) {
    emitWarning(
      `[emitUntitledArrangementFile] Unnamed arrangement file '${entry}' is a valid file`,
      entry,
      results,
      context
    );
    return arrContext;
  }
  console.log(`[emitUntitledArrangementFile] '${file}'`);
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
    return context;
  }
  if (!context.song) {
    emitWarning(
      `Unnamed arrangement is not inside a song context`,
      entry,
      results,
      context
    );
    return context;
  }
  const arrangement: Arrangement = {
    id: results.arrangementCount++,
    type: "arrangement",
    files: [],
    parts: [],
  };
  console.log(`[getOrEmitUntitledArrangement] '${arrangement}'`);
  context.song.arrangements.push(arrangement);
  return { ...context, arrangement };
};

const inspectContext = (context: Context) => {
  return `path: ${context.path}; song: ${context.song?.title}; arrangement: ${context.arrangement?.name}`;
};

const emitWarning = (
  message: string,
  entry: string,
  results: Results,
  context: Context
) => {
  console.warn(`${message} (${inspectContext(context)})`);
  results.warnings.push({
    context,
    entry,
    message,
  });
};

const getFile = (entry: string, context: Context): CollectionFile | null => {
  // TODO: copy file to assets folder and return the new url
  const extension = entry.split(".").pop();
  if (!extension) {
    return null;
  }
  return {
    type: "file",
    url: `${context.path}/${entry}`,
    extension,
  };
};
