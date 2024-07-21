import fs from "fs";
import path from "path";
import { ArgumentParser } from "argparse";
import { Collection, Project, Song, Instrument } from "../types";

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
  ext: string
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
  song: Song,
  destDir: string,
  songDirRelPath: string
) => {
  const partName = `${song.title} - ${oldPart.name}`;
  const partRelPath = path.join(songDirRelPath, partName);
  console.debug(`migratePart: '${partName}'`);
  const part = {
    name: partName,
    instrument: oldPart.instrument,
    midi: migrateAsset(srcDir, oldPart.assets, destDir, partRelPath, "midi"),
    svg: migrateAsset(srcDir, oldPart.assets, destDir, partRelPath, "svg"),
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
  destDir: string
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

  const song: Song = {
    title: songTitle,
    composer: oldSong.composer,
    sub: oldSong.sub,
    mscz,
    metajson: migrateAsset(
      srcDir,
      arr.assets,
      destDir,
      songRelPath,
      "metajson"
    ),
    midi: migrateAsset(srcDir, arr.assets, destDir, songRelPath, "midi"),
    parts: [],
    tags: [oldSong.style],
  };

  // add style to metajson
  if (song.metajson) {
    const metajsonAbsPath = path.join(destDir, song.metajson);
    const metajson = JSON.parse(fs.readFileSync(metajsonAbsPath, "utf8"));
    metajson.tags = song.tags.join(",");
    metajson.sub = metajson.previousSource;
    fs.writeFileSync(metajsonAbsPath, JSON.stringify(metajson, null, 2));
  }

  for (const oldPart of arr.parts) {
    migratePart(srcDir, oldPart, song, destDir, songDirRelPath);
  }

  const projectIdx = coll.projects.findIndex(
    (project: Project) => project.title === projectTitle
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
    fs.readFileSync(collectionJsonPath, "utf8")
  ) as OldCollection;
  const newCollection: Collection = {
    projects: [],
    scrapedAt: new Date(),
    version: 2,
  };
  for (const oldSong of oldCollection.songs) {
    for (const arrangement of oldSong.arrangements) {
      // corner-case for 'brazukas-chuva-suor-e-cerveja-carnaval-bh-2023-chuva-suor-e-cerveja'
      // there are two songs with the same title holding the same arrangement.
      // one of them has an empty parts array, so we can ignore it.
      if (arrangement.parts.length === 0) {
        console.info(
          `migrateCollection: ignoring arrangement with empty parts ${arrangement.id}`
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
          `migrateCollection: renaming '${oldSong.title}' to 'vermelho vermelhaço', arrangement '${arrangement.id}'`
        );
        oldSong.title = "vermelho vermelhaço";
      }
      console.debug(
        `migrateCollection: reading '${oldSong.title}/${arrangement.name}'`
      );
      migrateArrangement(srcDir, oldSong, arrangement, newCollection, destDir);
    }
  }
  fs.writeFileSync(
    path.join(destDir, "collection.json"),
    JSON.stringify(newCollection, null, 2)
  );
};

const run = async (args: string[]) => {
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
      `Output folder exists, removing all files inside '${outputPath}'`
    );
    fs.rmSync(outputPath, { recursive: true });
  }

  fs.mkdirSync(outputPath);

  console.info(
    `Indexing collection from '${inputPath}' into '${outputPath}'...`
  );

  console.debug = () => {};
  migrateCollection(inputPath, outputPath);
};

export default run;
