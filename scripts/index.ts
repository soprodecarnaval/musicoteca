// script runner that grabs all the scripts in the scripts folder and runs them
// by consuming the first cli arg, which has the script name
// imports are dynamic to avoid loading problematic dependencies (e.g. JWT + Node v25)

const main = async () => {
  const script = process.argv[2];
  if (!script) {
    console.error("ERROR: script name is required");
    return;
  }

  switch (script) {
    case "downloadGoogleDrive": {
      const { default: downloadGoogleDrive } = await import("./downloadGoogleDrive");
      await downloadGoogleDrive(process.argv.slice(3));
      break;
    }
    case "indexCollection": {
      const { default: indexCollection } = await import("./indexCollection");
      indexCollection(process.argv.slice(3));
      break;
    }
    case "migrateCollection": {
      const { default: migrateCollection } = await import("./migrateCollection");
      migrateCollection(process.argv.slice(3));
      break;
    }
    case "export": {
      const { default: exportAssets } = await import("./export");
      await exportAssets(process.argv.slice(3));
      break;
    }
    case "exportScore": {
      const { exportScore } = await import("./export");
      await exportScore(process.argv.slice(3));
      break;
    }
    case "exportProject": {
      const { exportProject } = await import("./export");
      await exportProject(process.argv.slice(3));
      break;
    }
    case "exportCollection": {
      const { exportCollection } = await import("./export");
      await exportCollection(process.argv.slice(3));
      break;
    }
    default:
      console.error(`ERROR: script '${script}' not found`);
  }
};

main();
