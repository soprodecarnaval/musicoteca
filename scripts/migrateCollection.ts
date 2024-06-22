import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { ArgumentParser } from "argparse";

export type Warning = {
  message: string;
  path: string;
};

type Instrument =
  | "bombardino"
  | "clarinete"
  | "flauta"
  | "sax alto"
  | "sax soprano"
  | "sax tenor"
  | "trombone"
  | "trombone pirata"
  | "trompete"
  | "trompete pirata"
  | "tuba";

type FileRef = {
  path: string;
  extension: string;
};

interface OldPart {
  name: string;
  instrument: Instrument;
  assets: FileRef[];
}

interface OldArrangement {
  id: string;
  assets: FileRef[];
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

type SourceFileRef = FileRef & {
  checksum?: string;
  updatedAt?: Date;
};

interface Part {
  name: string;
  instrument: Instrument;
  svg?: FileRef;
  midi?: FileRef;
  mp3?: FileRef;
}

interface Song {
  title: string;
  composer: string;
  sub: string;
  mscz: SourceFileRef;
  metajson?: FileRef;
  midi?: FileRef;
  mp3?: FileRef;
  parts: Part[];
}

interface Project {
  title: string;
  songs: Song[];
}

interface Collection {
  projects: Project[];
  scrapedAt: Date;
  version: 2;
}

const allPromises: Promise<any>[] = [];

const migrateAsset = (
  srcDir: string,
  assets: FileRef[],
  ext: string,
  destDir: string,
  basename: string,
): FileRef | undefined => {
  const oldRef = assets.find(({ extension }) => extension === `.${ext}`);
  if (!oldRef) {
    return undefined;
  }
  const srcPath = path.join(srcDir, oldRef.path);
  const destPath = path.join(destDir, `${basename}.${ext}`);
  console.log(`migrateAsset: ${srcPath} -> ${destPath}`);
  allPromises.push(fsp.copyFile(srcPath, destPath));
  return {
    path: destPath,
    extension: ext,
  };
};

const migratePart = (
  srcDir: string,
  oldPart: OldPart,
  arr: OldArrangement,
  song: Song,
  destDir: string,
) => {
  const partName = `${song.title} - ${oldPart.name}`;
  console.log(`migratePart: '${partName}'`);
  const part = {
    name: partName,
    instrument: oldPart.instrument,
    midi: migrateAsset(srcDir, oldPart.assets, "midi", destDir, partName),
    svg: migrateAsset(srcDir, oldPart.assets, "svg", destDir, partName),
    mp3: migrateAsset(srcDir, oldPart.assets, "mp3", destDir, partName),
  };
  song.parts.push(part);
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
  const songDir = path.join(destDir, projectTitle, songTitle);
  console.log(`migrateArrangement: '${songDir}'`);

  fs.mkdirSync(songDir, { recursive: true });

  const mscz = migrateAsset(srcDir, arr.assets, "mscz", songDir, songTitle);
  if (!mscz) {
    return;
  }

  const song: Song = {
    title: songTitle,
    composer: oldSong.composer,
    sub: oldSong.sub,
    mscz,
    metajson: migrateAsset(srcDir, arr.assets, "metajson", songDir, songTitle),
    midi: migrateAsset(srcDir, arr.assets, "midi", songDir, songTitle),
    mp3: migrateAsset(srcDir, arr.assets, "mp3", songDir, songTitle),
    parts: [],
  };

  for (const oldPart of arr.parts) {
    migratePart(srcDir, oldPart, arr, song, songDir);
  }

  const projectIdx = coll.projects.findIndex(
    (project: Project) => project.title === projectTitle,
  );
  if (projectIdx === -1) {
    coll.projects.push({
      title: projectTitle,
      songs: [song],
    });
  } else {
    coll.projects[projectIdx].songs.push(song);
  }
};

const migrateCollection = (srcDir: string, destDir: string) => {
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
    scrapedAt: new Date(),
    version: 2,
  };
  for (const oldSong of oldCollection.songs) {
    for (const arrangement of oldSong.arrangements) {
      console.log(
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

const main = async () => {
  const argParser = new ArgumentParser({
    description: "Migrates v1 collections to v2 collections",
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

  const args = argParser.parse_args();

  let inputPath = args["input"] as string;
  if (!inputPath) {
    console.error("ERROR: Input folder is required");
    console.info(argParser.format_help());
    return;
  }
  inputPath = path.resolve(inputPath);

  let outputPath = args["output"] as string;
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

  migrateCollection(inputPath, outputPath);
  await Promise.all(allPromises);
};

main();
