import fs from "fs";
import { ArgumentParser } from "argparse";
import Fuse from "fuse.js";
import { Collection, Score } from "../types";

const COLLECTION_PATH = "public/collection/collection.json";
const MIN_MATCH_SCORE = 0.3; // Fuse.js score (0 = perfect, 1 = no match), so 0.3 means 0.7 match
const AUTO_ACCEPT_THRESHOLD = 0.95; // Auto-accept matches with score >= 0.95

interface ParsedInput {
  type: "section" | "song";
  value: string;
}

const loadCollection = (): Collection => {
  const json = fs.readFileSync(COLLECTION_PATH, "utf-8");
  return JSON.parse(json);
};

const parseInputFile = (filePath: string): ParsedInput[] => {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const result: ParsedInput[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("##")) {
      result.push({ type: "section", value: trimmed.slice(2).trim() });
    } else {
      result.push({ type: "song", value: trimmed });
    }
  }

  return result;
};

const createFuseIndex = (collection: Collection, projectName?: string, allProjects?: boolean) => {
  const scores: Score[] = [];

  for (const project of collection.projects) {
    // Filter by project unless allProjects is true
    if (projectName && !allProjects && project.title !== projectName) {
      continue;
    }
    for (const score of project.scores) {
      scores.push(score);
    }
  }

  const fuse = new Fuse(scores, {
    keys: ["title"],
    includeScore: true,
    threshold: 0.4,
    ignoreDiacritics: true,
    ignoreLocation: true,
  });

  return { fuse, scores };
};

const keypress = async (): Promise<string> => {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.once("data", (data) => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      const key = data.toString();
      // Handle Ctrl+C
      if (key === "\x03") {
        console.log("\nAborted.");
        process.exit(1);
      }
      resolve(key.toLowerCase());
    });
  });
};

const prompt = async (question: string, defaultKey: string, options: string[]): Promise<string> => {
  const optionsStr = options
    .map((o) => (o === defaultKey ? `(${o.toUpperCase()})` : o))
    .join("/");
  process.stdout.write(`${question} ${optionsStr}: `);

  const key = await keypress();

  if (key === "\r" || key === "\n" || key === " " || !options.includes(key)) {
    console.log(defaultKey);
    return defaultKey;
  }

  console.log(key);
  return key;
};

const formatScore = (fuseScore: number): string => {
  // Fuse score: 0 = perfect match, 1 = no match
  // Convert to [0,1] where 1 = perfect match
  const score = 1 - fuseScore;
  return score.toFixed(2);
};

const run = async (args: string[]): Promise<void> => {
  const argParser = new ArgumentParser({
    description: "Build a songbook JSON from a list of songs",
  });

  argParser.add_argument("-i", "--input", {
    type: "str",
    dest: "input",
    required: true,
    help: "Input file with song list",
  });
  argParser.add_argument("-p", "--project", {
    type: "str",
    dest: "project",
    help: "Project name to prioritize matches",
  });
  argParser.add_argument("-o", "--output", {
    type: "str",
    dest: "output",
    help: "Output JSON file (default: PROJECT_NAME.json)",
  });
  argParser.add_argument("-a", "--all-projects", {
    dest: "allProjects",
    action: "store_true",
    help: "Search in all projects, not just the specified one",
  });

  const parsedArgs = argParser.parse_args(args);

  const inputPath = parsedArgs.input;
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const projectName = parsedArgs.project;
  const allProjects = parsedArgs.allProjects || false;
  const outputPath =
    parsedArgs.output ||
    (projectName ? `${projectName.replace(/ /g, "_")}.json` : "songbook.json");

  console.log(`Loading collection...`);
  const collection = loadCollection();
  const { fuse } = createFuseIndex(collection, projectName, allProjects);

  if (projectName && !allProjects) {
    console.log(`Searching only in project: ${projectName}`);
  }

  console.log(`Parsing input file: ${inputPath}`);
  const parsed = parseInputFile(inputPath);

  const items: any[] = [];
  let matchedCount = 0;
  let skippedCount = 0;
  let songIndex = 0;

  for (const entry of parsed) {
    if (entry.type === "section") {
      console.log(`\n=== ${entry.value} ===`);
      items.push({ type: "section", title: entry.value });
      continue;
    }

    songIndex++;
    const results = fuse.search(entry.value);
    const bestMatch = results[0];

    if (!bestMatch || bestMatch.score === undefined || bestMatch.score > MIN_MATCH_SCORE) {
      // No good match
      const hint = bestMatch
        ? `best: "${bestMatch.item.title}" ${formatScore(bestMatch.score!)}`
        : "no results";
      console.log(`${songIndex}. "${entry.value}" → NO MATCH (${hint})`);

      const action = await prompt("   ", "s", ["s", "m"]);

      if (action === "m") {
        // Manual mode: show top 5 results
        console.log("   Top matches:");
        const top5 = results.slice(0, 5);
        top5.forEach((r, i) => {
          console.log(`   ${i + 1}. "${r.item.title}" (${formatScore(r.score!)}) [${r.item.projectTitle}]`);
        });

        process.stdout.write("   Select (1-5) or 's' to skip: ");
        const selection = await keypress();
        console.log(selection);

        const selNum = parseInt(selection);
        if (selNum >= 1 && selNum <= top5.length) {
          const selected = top5[selNum - 1];
          items.push({ type: "score", score: selected.item });
          matchedCount++;
          console.log(`   → Selected: "${selected.item.title}"`);
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
      continue;
    }

    // Good match found
    const matchScore = 1 - bestMatch.score;
    const matchDisplay = `"${bestMatch.item.title}" (${formatScore(bestMatch.score)})`;
    const projectDisplay =
      allProjects && bestMatch.item.projectTitle !== projectName
        ? ` [${bestMatch.item.projectTitle}]`
        : "";

    process.stdout.write(`${songIndex}. "${entry.value}" → ${matchDisplay}${projectDisplay} `);

    // Auto-accept high-confidence matches
    if (matchScore >= AUTO_ACCEPT_THRESHOLD) {
      console.log("✓");
      items.push({ type: "score", score: bestMatch.item });
      matchedCount++;
      continue;
    }

    const action = await prompt("", "y", ["y", "n", "s"]);

    if (action === "y") {
      items.push({ type: "score", score: bestMatch.item });
      matchedCount++;
    } else if (action === "n") {
      // Show alternatives
      console.log("   Alternatives:");
      const alternatives = results.slice(0, 5);
      alternatives.forEach((r, i) => {
        console.log(`   ${i + 1}. "${r.item.title}" (${formatScore(r.score!)}) [${r.item.projectTitle}]`);
      });

      process.stdout.write("   Select (1-5) or 's' to skip: ");
      const selection = await keypress();
      console.log(selection);

      const selNum = parseInt(selection);
      if (selNum >= 1 && selNum <= alternatives.length) {
        const selected = alternatives[selNum - 1];
        items.push({ type: "score", score: selected.item });
        matchedCount++;
        console.log(`   → Selected: "${selected.item.title}"`);
      } else {
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log(`\nMatched: ${matchedCount} | Skipped: ${skippedCount}`);

  if (items.filter((i) => i.type === "score").length === 0) {
    console.log("No songs matched. Aborting.");
    process.exit(1);
  }

  const confirmAction = await prompt(`Write to ${outputPath}?`, "y", ["y", "n"]);

  if (confirmAction === "y") {
    const output = { items };
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Wrote ${outputPath}`);
  } else {
    console.log("Aborted.");
  }
};

run(process.argv.slice(2)).catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

export default run;
