import fs from "fs";
import path from "path";
import { ArgumentParser } from "argparse";
import { Collection, Project, Score, Instrument } from "../types";

export type Warning = {
  message: string;
  path: string;
};

export type OldFileRef = {
  path: string;
  extension: string;
};

interface OldPart {
  name: string;
  instrument: Instrument;
  assets: OldFileRef[];
}

interface OldArrangement {
  id: string;
  assets: OldFileRef[];
  name: string;
  parts: OldPart[];
  tags: string[];
}

interface OldSong {
  id: string;
  title: string;
  composer: string;
  sub: string;
  arrangements: OldArrangement[];
  style: string;
}

interface OldCollection {
  songs: OldSong[];
  tags: string[];
}

const migrateAsset = (
  srcDir: string,
  assets: OldFileRef[],
  destDir: string,
  relDestPath: string,
  ext: string,
): string => {
  const oldRef = assets.find(({ extension }) => extension === `.${ext}`);
  if (!oldRef) {
    throw new Error(`Asset not found: ${ext}`);
  }
  relDestPath += `.${ext}`;
  const srcPath = path.join(srcDir, oldRef.path);
  const destPath = path.join(destDir, relDestPath);
  console.debug(`migrateAsset: ${srcPath} -> ${destPath}`);
  fs.copyFileSync(srcPath, destPath);
  return relDestPath;
};

const migratePart = (
  srcDir: string,
  oldPart: OldPart,
  score: Score,
  destDir: string,
  scoreDirRelPath: string,
) => {
  const partName = `${score.title} - ${oldPart.name}`;
  const partRelPath = path.join(scoreDirRelPath, partName);
  console.debug(`migratePart: '${partName}'`);
  const svgPath = migrateAsset(srcDir, oldPart.assets, destDir, partRelPath, "svg");
  const part = {
    name: partName,
    instrument: oldPart.instrument,
    midi: migrateAsset(srcDir, oldPart.assets, destDir, partRelPath, "midi"),
    svg: svgPath ? [svgPath] : [],
  };
  score.parts.push(part);
};

const getProjectTitle = (arr: OldArrangement) => {
  const projectTitle = arr.name.split("-")[0].trim();
  // corner-case: merge 'besourinhos' into 'besourinhos 2024'
  if (projectTitle === "besourinhos") {
    return "besourinhos 2024";
  }
  return projectTitle;
};

const migrateArrangement = (
  srcDir: string,
  oldSong: OldSong,
  arr: OldArrangement,
  coll: Collection,
  destDir: string,
) => {
  const songTitle = oldSong.title;

  const projectTitle = getProjectTitle(arr);
  const songDirRelPath = path.join(projectTitle, songTitle);
  const songDir = path.join(destDir, songDirRelPath);
  console.debug(`migrateArrangement: '${songDir}'`);

  fs.mkdirSync(songDir, { recursive: true });

  const songRelPath = path.join(songDirRelPath, songTitle);
  const mscz = migrateAsset(srcDir, arr.assets, destDir, songRelPath, "mscz");
  if (!mscz) {
    return;
  }

  const score: Score = {
    id: path.join(projectTitle, songTitle),
    title: songTitle,
    // don't use the sub and composer from oldSong, because it might have been
    // backfilled from the song, instead of the arrangement's metajson.
    // we'll grab it from the metajson later.
    composer: "",
    sub: "",
    mscz,
    metajson: migrateAsset(
      srcDir,
      arr.assets,
      destDir,
      songRelPath,
      "metajson",
    ),
    midi: migrateAsset(srcDir, arr.assets, destDir, songRelPath, "midi"),
    parts: [],
    tags: [oldSong.style],
    projectTitle: projectTitle,
  };

  // TODO: bake the data we overwrite in the metajson into the mscz,
  //       otherwise it will be lost when the mscz is re-exported.
  if (score.metajson) {
    const metajsonAbsPath = path.join(destDir, score.metajson);
    const metajson = JSON.parse(fs.readFileSync(metajsonAbsPath, "utf8"));
    // the new format doesn't have the style in the file path,
    // so we'll add it to the metajson.tags.
    metajson.tags = score.tags.join(",");
    // the new format uses the lyrics field instead of previousSource.
    metajson.lyrics = metajson.previousSource;
    score.sub = metajson.lyrics;
    score.composer = metajson.composer;
    fs.writeFileSync(metajsonAbsPath, JSON.stringify(metajson, null, 2));
  }

  for (const oldPart of arr.parts) {
    migratePart(srcDir, oldPart, score, destDir, songDirRelPath);
  }

  const projectIdx = coll.projects.findIndex(
    (project: Project) => project.title === projectTitle,
  );
  if (projectIdx === -1) {
    coll.projects.push({
      title: projectTitle,
      scores: [score],
    });
  } else {
    coll.projects[projectIdx].scores.push(score);
  }
};

const migrateV1ToV3 = (srcDir: string, destDir: string) => {
  const collectionJsonPath = path.join(srcDir, "collection.json");
  if (!fs.existsSync(collectionJsonPath)) {
    console.error("ERROR: No collection.json found in input folder");
    return;
  }
  const oldCollection = JSON.parse(
    fs.readFileSync(collectionJsonPath, "utf8"),
  ) as OldCollection;
  const newCollection: Collection = {
    projects: [],
    version: 3,
  };
  for (const oldSong of oldCollection.songs) {
    for (const arrangement of oldSong.arrangements) {
      // corner-case for 'brazukas-chuva-suor-e-cerveja-carnaval-bh-2023-chuva-suor-e-cerveja'
      // there are two songs with the same title holding the same arrangement.
      // one of them has an empty parts array, so we can ignore it.
      if (arrangement.parts.length === 0) {
        console.info(
          `migrateCollection: ignoring arrangement with empty parts ${arrangement.id}`,
        );
        continue;
      }
      // corner-case for 'manifestacao-vermelho-carnaval-bh-2023-vermelho-vermelhaco'
      // it has the same song title as 'funks-vermelho-carnaval-bh-2023-vermelho'
      // and both would land in the same project ('carnaval bh 2023'),
      // so we need to rename the song title.
      if (
        arrangement.id ==
        "manifestacao-vermelho-carnaval-bh-2023-vermelho-vermelhaco"
      ) {
        console.info(
          `migrateCollection: renaming '${oldSong.title}' to 'vermelho vermelhaço', arrangement '${arrangement.id}'`,
        );
        oldSong.title = "vermelho vermelhaço";
      }
      console.debug(
        `migrateCollection: reading '${oldSong.title}/${arrangement.name}'`,
      );
      migrateArrangement(srcDir, oldSong, arrangement, newCollection, destDir);
    }
  }
  fs.writeFileSync(
    path.join(destDir, "collection.json"),
    JSON.stringify(newCollection, null, 2),
  );
};

interface V2Part {
  name: string;
  instrument: Instrument;
  svg: string;
  midi: string;
}

interface V2Score {
  id: string;
  title: string;
  composer: string;
  sub: string;
  mscz: string;
  metajson: string;
  midi: string;
  parts: V2Part[];
  tags: string[];
  projectTitle: string;
}

interface V2Project {
  title: string;
  scores: V2Score[];
}

interface V2Collection {
  projects: V2Project[];
  version: 2;
}

const migrateV2ToV3 = (srcDir: string, destDir: string) => {
  const collectionJsonPath = path.join(srcDir, "collection.json");
  if (!fs.existsSync(collectionJsonPath)) {
    console.error("ERROR: No collection.json found in input folder");
    return;
  }
  const v2Collection = JSON.parse(
    fs.readFileSync(collectionJsonPath, "utf8"),
  ) as V2Collection;

  // Copy all files from srcDir to destDir
  console.info(`Copying files from '${srcDir}' to '${destDir}'...`);
  fs.cpSync(srcDir, destDir, { recursive: true });

  // Convert v2 to v3: svg: string -> svg: string[]
  const v3Collection: Collection = {
    projects: v2Collection.projects.map((project) => ({
      title: project.title,
      scores: project.scores.map((score) => ({
        id: score.id,
        title: score.title,
        composer: score.composer,
        sub: score.sub,
        mscz: score.mscz,
        metajson: score.metajson,
        midi: score.midi,
        tags: score.tags,
        projectTitle: score.projectTitle,
        parts: score.parts.map((part) => ({
          name: part.name,
          instrument: part.instrument,
          svg: part.svg ? [part.svg] : [],
          midi: part.midi,
        })),
      })),
    })),
    version: 3,
  };

  fs.writeFileSync(
    path.join(destDir, "collection.json"),
    JSON.stringify(v3Collection, null, 2),
  );
  console.info(`Migrated ${v3Collection.projects.length} projects to v3`);
};

type CollectionVersion = 1 | 2 | 3;

const detectCollectionVersion = (collectionJsonPath: string): CollectionVersion => {
  const collection = JSON.parse(fs.readFileSync(collectionJsonPath, "utf8"));
  // v3 has version: 3
  if (collection.version === 3) {
    return 3;
  }
  // v2 has version: 2 or has projects array with scores
  if (collection.version === 2 || (collection.projects && !collection.songs)) {
    return 2;
  }
  // v1 has songs array
  return 1;
};

const migrateCollection = (srcDir: string, destDir: string) => {
  const collectionJsonPath = path.join(srcDir, "collection.json");
  if (!fs.existsSync(collectionJsonPath)) {
    console.error("ERROR: No collection.json found in input folder");
    return;
  }

  const version = detectCollectionVersion(collectionJsonPath);
  console.info(`Detected collection version: ${version}`);

  if (version === 3) {
    console.info("Collection is already v3, nothing to migrate");
    return;
  }

  if (version === 2) {
    migrateV2ToV3(srcDir, destDir);
  } else {
    migrateV1ToV3(srcDir, destDir);
  }
};

const run = async (args: string[]) => {
  const argParser = new ArgumentParser({
    description: "Migrates v1 or v2 collections to v3 format",
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

  const parseedArgs = argParser.parse_args(args);

  let inputPath = parseedArgs["input"] as string;
  if (!inputPath) {
    console.error("ERROR: Input folder is required");
    console.info(argParser.format_help());
    return;
  }
  inputPath = path.resolve(inputPath);

  let outputPath = parseedArgs["output"] as string;
  if (!outputPath) {
    console.error("ERROR: Output folder is required");
    console.info(argParser.format_help());
    return;
  }
  outputPath = path.resolve(outputPath);

  if (fs.existsSync(outputPath)) {
    console.info(
      `Output folder exists, removing all files inside '${outputPath}'`,
    );
    fs.rmSync(outputPath, { recursive: true });
  }

  fs.mkdirSync(outputPath);

  console.info(
    `Indexing collection from '${inputPath}' into '${outputPath}'...`,
  );

  console.debug = () => {};
  migrateCollection(inputPath, outputPath);
};

export default run;
