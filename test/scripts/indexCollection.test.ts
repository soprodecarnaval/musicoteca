import fs from "fs";
import crypto from "crypto";
import path from "path";
import { Collection } from "../../types";
import indexCollection from "../../scripts/indexCollection";
import { describe, it, expect } from "vitest";

const inputDir = "public/collection";
const outputDir = "test/scripts/indexCollectionTestOutput";

const getChecksum = (file: string) => {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
};

const expectEqualFiles = (file1: string, file2: string) => {
  expect(getChecksum(file1)).toEqual(getChecksum(file2));
};
const expectEqualDirs = (dir1: string, dir2: string, skip: Set<string>) => {
  const files1 = fs
    .readdirSync(dir1)
    .filter((file) => !skip.has(file))
    .sort();
  const files2 = fs
    .readdirSync(dir2)
    .filter((file) => !skip.has(file))
    .sort();

  expect(files1).toEqual(files2);

  files1.forEach((file) => {
    const path1 = path.join(dir1, file);
    const path2 = path.join(dir2, file);

    const stat1 = fs.statSync(path1);
    if (stat1.isDirectory()) {
      expectEqualDirs(path1, path2, skip);
    } else {
      expectEqualFiles(path1, path2);
    }
  });
};

describe("indexCollection", () => {
  it("should be idempotent", () => {
    indexCollection(["--input", inputDir, "--output", outputDir]);

    // compare file structure recursively
    const skip = new Set(["collection.json", ".DS_Store", "warnings.json"]);
    expectEqualDirs(inputDir, outputDir, skip);

    // compare collection.json
    const inputCollectionPath = path.join(inputDir, "collection.json");
    const outputCollectionPath = path.join(outputDir, "collection.json");

    const inputCollection = JSON.parse(
      fs.readFileSync(inputCollectionPath, "utf-8")
    ) as Collection;
    const outputCollection = JSON.parse(
      fs.readFileSync(outputCollectionPath, "utf-8")
    ) as Collection;
    // do some things to ensure comparison works:
    // - sort projects by title
    // - sort songs by title
    // - sort parts by name
    // - sort tags
    // - set sortedAt to the same value
    inputCollection.scrapedAt = outputCollection.scrapedAt;
    inputCollection.projects.sort((a, b) => a.title.localeCompare(b.title));
    inputCollection.projects.forEach((project) => {
      project.songs.sort((a, b) => a.title.localeCompare(b.title));
      project.songs.forEach((song) => {
        song.tags.sort();
        song.parts.sort((a, b) => a.name.localeCompare(b.name));
      });
    });
    outputCollection.projects.sort((a, b) => a.title.localeCompare(b.title));
    outputCollection.projects.forEach((project) => {
      project.songs.sort((a, b) => a.title.localeCompare(b.title));
      project.songs.forEach((song) => {
        song.tags.sort();
        song.parts.sort((a, b) => a.name.localeCompare(b.name));
      });
    });
    expect(inputCollection.projects.length).toEqual(
      outputCollection.projects.length
    );

    // assert project by project to get better error messages
    for (let i = 0; i < inputCollection.projects.length; i++) {
      const inputProject = inputCollection.projects[i];
      const outputProject = outputCollection.projects[i];
      expect(inputProject.title).toEqual(outputProject.title);
      expect(inputProject.songs.map((s) => s.title)).toEqual(
        outputProject.songs.map((s) => s.title)
      );

      // assert song by song to get better error messages
      for (let j = 0; j < inputProject.songs.length; j++) {
        const inputSong = inputProject.songs[j];
        const outputSong = outputProject.songs[j];
        expect(inputSong).toEqual(outputSong);

        // assert part by part to get better error messages
        for (let k = 0; k < inputSong.parts.length; k++) {
          const inputPart = inputSong.parts[k];
          const outputPart = outputSong.parts[k];
          expect(inputPart).toEqual(outputPart);
        }
      }
    }
  });
});
