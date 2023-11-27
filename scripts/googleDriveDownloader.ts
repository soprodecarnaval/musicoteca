// Downloads a whole folder from Google Drive into the current directory.
// Usage: ts-node scripts/googleDriveDownloader.ts <folderId>

import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import { ArgumentParser } from "argparse";
import {
  GoogleAuth,
  JSONClient,
} from "google-auth-library/build/src/auth/googleauth";

const drive = google.drive("v3");

const downloadFile = async (
  auth: GoogleAuth<JSONClient>,
  fileId: string,
  filePath: string
) => {
  console.debug(`File '${fileId}' -> '${filePath}'...`);
  const res = await drive.files.get(
    {
      auth,
      fileId,
      alt: "media",
    },
    { responseType: "stream" }
  );

  const folder = path.dirname(filePath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const dest = fs.createWriteStream(filePath);
  res.data.on("end", () => console.debug(`Wrote ${filePath}`));
  res.data.on("error", (err) => console.error(err));
  res.data.pipe(dest);
};

const downloadFolder = async (
  auth: GoogleAuth<JSONClient>,
  folderId: string,
  folderPath: string,
  pattern: string
): Promise<Array<Promise<void>>> => {
  console.debug(`Folder '${folderId}' -> '${folderPath}'...`);

  const res = await drive.files.list({
    auth,
    q: `'${folderId}' in parents`,
    fields: "files(id, name, mimeType)",
  });

  const files = res.data.files;
  const promises: Array<Promise<void>> = [];
  if (files) {
    console.debug(`List ${folderId}: ${files.length} files`);

    for (const file of files) {
      if (!file.name || !file.id) {
        continue;
      }
      const filePath = path.join(folderPath, file.name);
      if (file.mimeType === "application/vnd.google-apps.folder") {
        const nestedPromises = await downloadFolder(
          auth,
          file.id,
          filePath,
          pattern
        );
        promises.push(...nestedPromises);
      } else {
        if (filePath.match(pattern)) {
          promises.push(downloadFile(auth, file.id, filePath));
        } else {
          console.debug(`Skipping '${filePath}'`);
        }
      }
    }
  }
  return promises;
};

const main = async () => {
  const startTime = Date.now();

  const argParser = new ArgumentParser({
    description:
      "Reads a score collection from a folder, copies the valid files over to the output folder and generates an index file.",
  });

  argParser.add_argument("-i", "--input", {
    type: "str",
    dest: "folderId",
    help: "Google Drive folder ID",
  });
  argParser.add_argument("-o", "--output", {
    type: "str",
    dest: "output",
    help: "Output folder",
  });
  argParser.add_argument("-g", "--pattern", {
    type: "str",
    dest: "pattern",
    help: "pattern pattern to match files",
  });
  argParser.add_argument("-v", "--verbose", {
    dest: "verbose",
    action: "store_true",
    help: "Verbose mode",
  });
  argParser.add_argument("-k", "--keyfile", {
    type: "str",
    dest: "keyfile",
    help: "Path to the keyfile",
  });

  const args = argParser.parse_args();

  let folderId = args["folderId"];
  if (!folderId) {
    console.error("ERROR: Google Drive folder ID is required");
    console.info(argParser.format_help());
    return;
  }

  let outputPath = args["output"];
  if (!outputPath) {
    console.error("ERROR: Output folder is required");
    console.info(argParser.format_help());
    return;
  }
  outputPath = path.resolve(outputPath);

  let keyFile = args["keyfile"];
  if (!keyFile) {
    console.error("ERROR: Keyfile is required");
    console.info(argParser.format_help());
    return;
  }

  const pattern = args["pattern"] || ".*";
  const verbose = args["verbose"] || false;
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

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  console.info(
    `Downloading Google Drive folder '${folderId}' into '${outputPath}'...`
  );

  const folderPromises = await downloadFolder(
    auth,
    folderId,
    outputPath,
    pattern
  );
  await Promise.all(folderPromises);

  const elapsedTime = Date.now() - startTime;
  console.info(`Done. Took ${elapsedTime / 1000}s`);
};

main();
