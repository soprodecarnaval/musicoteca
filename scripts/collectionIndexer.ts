import fs from "fs";
import {
  Arrangement,
  CollectionFile,
  Instrument,
  Part,
  Song,
} from "../src/types";
import path from "path";

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
  return partFileExtensions.has(extension.toLocaleLowerCase());
};

// const hasPartFileExtension = (entry: string) => {
//   const extension = entry.split(".").pop();
//   if (!extension) {
//     return false;
//   }
//   return isPartFileExtension(extension);
// };

// const not = (fn: (entry: string) => boolean) => (entry: string) => !fn(entry);

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
  arrangementCount: number;
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
            test: isPartFileExtension,
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
                test: isPartFileExtension,
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
    arrangementCount: 0,
    songCount: 0,
  };
  const rootContext: Context = {
    inputPath,
    outputPath,
    path: ".",
    arrangement: null,
    song: null,
    tags: [],
  };
  readDirectory(fileSystemStructure, inputPath, results, rootContext);

  console.log(`[indexCollection] Writing index at '${outputPath}/index.json'`);
  const songsJson = JSON.stringify(results.songs, null, 2);
  fs.writeFileSync(`${outputPath}/index.json`, songsJson);

  if (results.warnings.length > 0) {
    console.log(
      `[indexCollection] Writing warnings at '${outputPath}/warnings.json'`
    );
    const warningsJson = JSON.stringify(results.warnings, null, 2);
    fs.writeFileSync(`${outputPath}/warnings.json`, warningsJson);
  }

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
  fs.readdirSync(path).forEach((entry) => {
    readEntry(structure, entry, results, dirContext);
  });

  return results;
};

const doesEntryMatchNode = (
  entry: string,
  node: CollectionNode,
  context: Context
): boolean => {
  const entryPath = `${context.path}/${entry}`;
  const entryIsDir = fs.statSync(entryPath).isDirectory();
  const nodeIsDir = node.type === "dir";
  console.log(
    `[doesEntryMatchNode] testing entry '${entry}' against node '${node.label}'`
  );
  if (nodeIsDir != entryIsDir) {
    console.log(
      `[doesEntryMatchNode] wrong node type (nodeIsDir: ${nodeIsDir}, entryIsDir: ${entryIsDir})`
    );
    return false;
  }
  if (node.test && !node.test(entry)) {
    console.log(`[doesEntryMatchNode] node test failed`);
    return false;
  }
  console.log(`[doesEntryMatchNode] matched node`);
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
  const node = structure.find((n) => doesEntryMatchNode(entry, n, context));
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

  const entryPath = `${context.path}/${entry}`;
  if (!fs.statSync(entryPath).isDirectory()) {
    emitWarning(
      `[readDirectoryEntry] Directory entry '${entryPath}' is not a directory`,
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
  console.log(`[emitTag] '${entry}' context: ${inspectContext(context)}'`);
  const tag = entry.toLocaleLowerCase();

  context.tags = [tag];
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
    tags: context.tags,
    arrangements: [],
  };
  console.log(`[emitSong] '${JSON.stringify(song)}'`);
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
  const name = filenameParts.find((slice) => instrumentNames.has(slice));
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

  const file = emitFile(entry, context);
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
  const file = emitFile(entry, context);
  if (!file) {
    emitWarning(
      `[emitArrangementFile] Arrangement file '${entry}' is a valid file`,
      entry,
      results,
      context
    );
    return context;
  }
  console.log(`[emitArrangementFile] '${JSON.stringify(file)}'`);
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

  const file = emitFile(entry, context);
  if (!file) {
    emitWarning(
      `[emitUntitledArrangementFile] Unnamed arrangement file '${entry}' is a valid file`,
      entry,
      results,
      context
    );
    return arrContext;
  }
  console.log(`[emitUntitledArrangementFile] '${JSON.stringify(file)}'`);
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
  console.log(
    `[getOrEmitUntitledArrangement] '${JSON.stringify(arrangement)}'`
  );
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

const emitFile = (entry: string, context: Context): CollectionFile | null => {
  const extension = entry.split(".").pop();
  if (!extension) {
    return null;
  }

  const entryPath = `${context.path}/${entry}`;
  const url = "/" + path.relative(context.inputPath, entryPath);

  // copy file to output
  const outputPath = `${context.outputPath}/${url}`;
  console.log(`[emitFile] Copying file '${entryPath}' to '${outputPath}'`);
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

const main = () => {
  const input = "test/scripts/collectionIndexer";
  const output = "public/collection";

  if (!fs.existsSync(output)) {
    fs.mkdirSync(output);
  }

  console.log(`Indexing collection from '${input}' into '${output}'...`);
  indexCollection(input, output);
};

main();
