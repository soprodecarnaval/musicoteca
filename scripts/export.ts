import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import readline from "readline";

const COLLECTION_DIR = "public/collection";

type InputType = "mscz" | "score" | "project" | "collection";

interface DetectedInput {
  type: InputType;
  path: string;
}

interface ExportOptions {
  force: boolean;
}

const parseExportOptions = (args: string[]): { paths: string[]; opts: ExportOptions } => {
  const paths: string[] = [];
  const opts: ExportOptions = { force: false };
  for (const arg of args) {
    if (arg === "--force" || arg === "-f") {
      opts.force = true;
    } else if (!arg.startsWith("-")) {
      paths.push(arg);
    }
  }
  return { paths, opts };
};

const detectMscore = (): string => {
  try {
    execSync("which mscore", { stdio: "ignore" });
    return "mscore";
  } catch {
    const macPath = "/Applications/MuseScore 3.app/Contents/MacOS/mscore";
    if (process.platform === "darwin" && fs.existsSync(macPath)) {
      return macPath;
    }
    throw new Error("mscore not found. Install MuseScore or add it to PATH.");
  }
};

const prompt = async (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

const detectInputType = (inputPath: string): DetectedInput => {
  const stat = fs.statSync(inputPath);

  if (stat.isFile() && inputPath.endsWith(".mscz")) {
    return { type: "mscz", path: inputPath };
  }

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(inputPath);

    // Check if it's a score folder (contains .mscz)
    const hasMscz = entries.some((e) => e.endsWith(".mscz"));
    if (hasMscz) {
      return { type: "score", path: inputPath };
    }

    // Check if it's a project folder (subdirs contain .mscz)
    const subdirs = entries.filter((e) =>
      fs.statSync(path.join(inputPath, e)).isDirectory()
    );
    const isProject = subdirs.some((subdir) => {
      const subEntries = fs.readdirSync(path.join(inputPath, subdir));
      return subEntries.some((e) => e.endsWith(".mscz"));
    });
    if (isProject) {
      return { type: "project", path: inputPath };
    }

    // Check if it's a collection folder (subdirs are projects)
    const isCollection = subdirs.some((subdir) => {
      const projectPath = path.join(inputPath, subdir);
      const projectEntries = fs.readdirSync(projectPath);
      return projectEntries.some((e) => {
        const scorePath = path.join(projectPath, e);
        if (!fs.statSync(scorePath).isDirectory()) return false;
        const scoreEntries = fs.readdirSync(scorePath);
        return scoreEntries.some((f) => f.endsWith(".mscz"));
      });
    });
    if (isCollection) {
      return { type: "collection", path: inputPath };
    }
  }

  throw new Error(`Cannot determine input type for: ${inputPath}`);
};

const findMsczInFolder = (folderPath: string): string | undefined => {
  const entries = fs.readdirSync(folderPath);
  const mscz = entries.find((e) => e.endsWith(".mscz"));
  return mscz ? path.join(folderPath, mscz) : undefined;
};

const findLooseMsczFiles = (projectPath: string): string[] => {
  return fs
    .readdirSync(projectPath)
    .filter((e) => e.endsWith(".mscz"))
    .map((e) => path.join(projectPath, e));
};

const hasExportedAssets = (folderPath: string): boolean => {
  const entries = fs.readdirSync(folderPath);
  return entries.some((e) => e.endsWith(".svg"));
};

const cleanupExportedAssets = (folderPath: string): void => {
  const entries = fs.readdirSync(folderPath);
  const assetExtensions = [".svg", ".midi", ".metajson"];
  for (const entry of entries) {
    const ext = path.extname(entry);
    if (assetExtensions.includes(ext)) {
      const filePath = path.join(folderPath, entry);
      fs.unlinkSync(filePath);
    }
  }
};

const moveLooseMsczToFolder = (msczPath: string, projectPath: string): string => {
  const fileName = path.basename(msczPath);
  const songName = fileName.replace(/\.mscz$/, "");
  const destDir = path.join(projectPath, songName);
  const destPath = path.join(destDir, fileName);

  fs.mkdirSync(destDir, { recursive: true });
  fs.renameSync(msczPath, destPath);
  console.log(`Moved: ${fileName} → ${songName}/${fileName}`);
  return destDir;
};

const generateAssets = (mscore: string, msczPath: string): void => {
  const basePath = msczPath.replace(/\.mscz$/, "");
  const job = [
    {
      in: msczPath,
      out: [
        [`${basePath}_`, ".svg"],
        [`${basePath}_`, ".midi"],
        `${basePath}.midi`,
        `${basePath}.metajson`,
      ],
    },
  ];

  const jobPath = "/tmp/media-generation.json";
  fs.writeFileSync(jobPath, JSON.stringify(job, null, 2));
  console.log(`Generating assets for: ${path.basename(msczPath)}`);
  execSync(`"${mscore}" -j "${jobPath}"`, { stdio: "inherit" });
};

const listScoreFolders = (projectPath: string): string[] => {
  return fs
    .readdirSync(projectPath)
    .map((e) => path.join(projectPath, e))
    .filter((p) => fs.statSync(p).isDirectory())
    .filter((p) => findMsczInFolder(p));
};

const listProjectFolders = (collectionPath: string): string[] => {
  return fs
    .readdirSync(collectionPath)
    .map((e) => path.join(collectionPath, e))
    .filter((p) => fs.statSync(p).isDirectory())
    .filter((p) => listScoreFolders(p).length > 0);
};

const isInCollection = (
  msczPath: string
): { inCollection: boolean; expectedPath?: string; projectName?: string } => {
  const absPath = path.resolve(msczPath);
  const collectionAbs = path.resolve(COLLECTION_DIR);

  if (!absPath.startsWith(collectionAbs)) {
    return { inCollection: false };
  }

  // Expected structure: collection/project/song/song.mscz
  const relPath = path.relative(collectionAbs, absPath);
  const parts = relPath.split(path.sep);

  if (parts.length !== 3) {
    return { inCollection: false };
  }

  const [projectName, songName, fileName] = parts;
  const expectedFileName = `${songName}.mscz`;

  if (fileName !== expectedFileName) {
    const expectedPath = path.join(
      collectionAbs,
      projectName,
      songName,
      expectedFileName
    );
    return { inCollection: false, expectedPath, projectName };
  }

  return { inCollection: true, projectName };
};

const moveMsczToCollection = async (
  msczPath: string,
  projectName: string
): Promise<string> => {
  const fileName = path.basename(msczPath);
  const songName = fileName.replace(/\.mscz$/, "");
  const destDir = path.join(COLLECTION_DIR, projectName, songName);
  const destPath = path.join(destDir, fileName);

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(msczPath, destPath);
  console.log(`Copied to: ${destPath}`);
  return destPath;
};

const reindexCollection = (): void => {
  console.log("\n=== Indexing collection ===");
  const tmpCollection = "/tmp/collection";
  if (fs.existsSync(tmpCollection)) {
    fs.rmSync(tmpCollection, { recursive: true });
  }
  fs.cpSync(COLLECTION_DIR, tmpCollection, { recursive: true });
  execSync(
    `npx tsx scripts/runIndexCollection.ts -i ${tmpCollection} -o ${COLLECTION_DIR}`,
    { stdio: "inherit" }
  );
};

const exportScoreAssets = (mscore: string, folderPath: string, opts: ExportOptions): boolean => {
  const msczPath = findMsczInFolder(folderPath);
  if (!msczPath) {
    throw new Error(`No .mscz file found in: ${folderPath}`);
  }

  const hasAssets = hasExportedAssets(folderPath);

  if (hasAssets && !opts.force) {
    console.log(`Skipping (already exported): ${path.basename(folderPath)}`);
    return false;
  }

  if (hasAssets && opts.force) {
    console.log(`Cleaning up existing assets: ${path.basename(folderPath)}`);
    cleanupExportedAssets(folderPath);
  }

  generateAssets(mscore, msczPath);
  return true;
};

const exportProjectAssets = (mscore: string, projectPath: string, opts: ExportOptions): void => {
  // Move loose mscz files to proper folder structure
  const looseMsczFiles = findLooseMsczFiles(projectPath);
  if (looseMsczFiles.length > 0) {
    console.log(`Found ${looseMsczFiles.length} loose mscz files, moving to folders...`);
    for (const msczFile of looseMsczFiles) {
      moveLooseMsczToFolder(msczFile, projectPath);
    }
  }

  const scoreFolders = listScoreFolders(projectPath);
  console.log(
    `Found ${scoreFolders.length} scores in project: ${path.basename(projectPath)}`
  );

  let exported = 0;
  let skipped = 0;
  for (const scoreFolder of scoreFolders) {
    if (exportScoreAssets(mscore, scoreFolder, opts)) {
      exported++;
    } else {
      skipped++;
    }
  }

  console.log(`Exported: ${exported}, Skipped: ${skipped}`);
};

const exportCollectionAssets = (
  mscore: string,
  collectionPath: string,
  opts: ExportOptions
): void => {
  const projectFolders = listProjectFolders(collectionPath);
  console.log(`Found ${projectFolders.length} projects in collection`);

  for (const projectFolder of projectFolders) {
    console.log(`\n=== Project: ${path.basename(projectFolder)} ===`);
    exportProjectAssets(mscore, projectFolder, opts);
  }
};

const exportMsczAssets = async (
  mscore: string,
  msczPath: string,
  opts: ExportOptions
): Promise<void> => {
  const { inCollection, projectName } = isInCollection(msczPath);

  let targetPath = msczPath;
  let targetFolder: string;

  if (!inCollection) {
    console.log(`File is not in collection: ${msczPath}`);
    const project = await prompt("Enter project name: ");
    if (!project) {
      throw new Error("Project name is required");
    }
    targetPath = await moveMsczToCollection(msczPath, project);
    targetFolder = path.dirname(targetPath);
  } else {
    console.log(`File is in collection (project: ${projectName})`);
    targetFolder = path.dirname(msczPath);
  }

  const hasAssets = hasExportedAssets(targetFolder);
  if (hasAssets && !opts.force) {
    console.log(`Skipping (already exported): ${path.basename(targetFolder)}`);
    return;
  }
  if (hasAssets && opts.force) {
    console.log(`Cleaning up existing assets: ${path.basename(targetFolder)}`);
    cleanupExportedAssets(targetFolder);
  }

  generateAssets(mscore, targetPath);
};

// Exported runners for scripts/index.ts

export const exportScore = async (args: string[]): Promise<void> => {
  const { paths, opts } = parseExportOptions(args);
  const scorePath = paths[0];
  if (!scorePath) {
    console.error("Usage: npm run export:score <score-folder> [--force]");
    return;
  }
  const resolved = path.resolve(scorePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Path not found: ${resolved}`);
  }
  const mscore = detectMscore();
  console.log(`Using MuseScore: ${mscore}`);
  if (opts.force) console.log("Force mode: re-exporting all assets");
  console.log("");
  exportScoreAssets(mscore, resolved, opts);
  reindexCollection();
  console.log("\n=== Done ===");
};

export const exportProject = async (args: string[]): Promise<void> => {
  const { paths, opts } = parseExportOptions(args);
  const projectPath = paths[0];
  if (!projectPath) {
    console.error("Usage: npm run export:project <project-folder> [--force]");
    return;
  }
  const resolved = path.resolve(projectPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Path not found: ${resolved}`);
  }
  const mscore = detectMscore();
  console.log(`Using MuseScore: ${mscore}`);
  if (opts.force) console.log("Force mode: re-exporting all assets");
  console.log("");
  exportProjectAssets(mscore, resolved, opts);
  reindexCollection();
  console.log("\n=== Done ===");
};

export const exportCollection = async (args: string[]): Promise<void> => {
  const { paths, opts } = parseExportOptions(args);
  const collectionPath = paths[0] || COLLECTION_DIR;
  const resolved = path.resolve(collectionPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Path not found: ${resolved}`);
  }
  const mscore = detectMscore();
  console.log(`Using MuseScore: ${mscore}`);
  if (opts.force) console.log("Force mode: re-exporting all assets");
  console.log("");
  exportCollectionAssets(mscore, resolved, opts);
  reindexCollection();
  console.log("\n=== Done ===");
};

// Auto-detect export (default)
const run = async (args: string[]): Promise<void> => {
  const { paths, opts } = parseExportOptions(args);
  const inputPath = paths[0];

  if (!inputPath) {
    console.log(`Usage: npm run export <path> [--force]

<path> can be:
  - .mscz file: exports assets, prompts for project if not in collection
  - score folder: exports assets for the mscz inside
  - project folder: exports assets for all scores (skips already exported)
  - collection folder: exports assets for all projects

Options:
  --force, -f  Re-export all assets, even if already exported

Or use specific commands:
  npm run export:score <score-folder> [--force]
  npm run export:project <project-folder> [--force]
  npm run export:collection [collection-folder] [--force]`);
    return;
  }

  const resolvedPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Path not found: ${resolvedPath}`);
  }

  const mscore = detectMscore();
  console.log(`Using MuseScore: ${mscore}`);
  if (opts.force) console.log("Force mode: re-exporting all assets");

  const detected = detectInputType(resolvedPath);
  console.log(`Detected: ${detected.type}\n`);

  switch (detected.type) {
    case "mscz":
      await exportMsczAssets(mscore, detected.path, opts);
      break;
    case "score":
      exportScoreAssets(mscore, detected.path, opts);
      break;
    case "project":
      exportProjectAssets(mscore, detected.path, opts);
      break;
    case "collection":
      exportCollectionAssets(mscore, detected.path, opts);
      break;
  }

  reindexCollection();
  console.log("\n=== Done ===");
};

export default run;
