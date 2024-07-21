// script runner that grabs all the scripts in the scripts folder and runs them
// by consuming the first cli arg, which has the script name

import downloadGoogleDrive from "./downloadGoogleDrive";
import indexCollection from "./indexCollection";
import migrateCollection from "./migrateCollection";

const main = async () => {
  const script = process.argv[2];
  if (!script) {
    console.error("ERROR: script name is required");
    return;
  }

  switch (script) {
    case "downloadGoogleDrive":
      await downloadGoogleDrive(process.argv.slice(3));
      break;
    case "indexCollection":
      indexCollection(process.argv.slice(3));
      break;
    case "migrateCollection":
      migrateCollection(process.argv.slice(3));
      break;
    default:
      console.error(`ERROR: script '${script}' not found`);
  }
};

main();
