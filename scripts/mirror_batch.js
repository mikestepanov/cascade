import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define all target pages to mirror
const TARGETS = [
  // Linear
  { url: "https://linear.app/homepage", competitor: "linear", page: "homepage" },
  { url: "https://linear.app/features", competitor: "linear", page: "features" },
  { url: "https://linear.app/pricing", competitor: "linear", page: "pricing" },
  { url: "https://linear.app/docs", competitor: "linear", page: "docs" },

  // ClickUp
  { url: "https://clickup.com", competitor: "clickup", page: "home" },
  { url: "https://clickup.com/pricing", competitor: "clickup", page: "pricing" },
  { url: "https://clickup.com/features", competitor: "clickup", page: "features" },

  // Notion
  { url: "https://www.notion.so/product", competitor: "notion", page: "product" },
  { url: "https://www.notion.so/pricing", competitor: "notion", page: "pricing" },
  { url: "https://www.notion.so/templates", competitor: "notion", page: "templates" },
];

// Run mirror script for each target sequentially
// biome-ignore lint/suspicious/useAwait: returns Promise constructor
async function runMirror(target) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "scrape_full_mirror.js");
    const child = spawn("node", [scriptPath, target.url, target.competitor, target.page], {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(`Failed: ${target.competitor}/${target.page}`);
        resolve(); // Continue even on failure
      }
    });

    child.on("error", (err) => {
      console.error(`Error: ${err.message}`);
      resolve();
    });
  });
}

async function main() {
  console.log("\n🚀 OMEGA BATCH MIRROR");
  console.log(
    `   Capturing ${TARGETS.length} pages from ${[...new Set(TARGETS.map((t) => t.competitor))].length} competitors\n`,
  );
  console.log("=".repeat(60) + "\n");

  const startTime = Date.now();

  for (let i = 0; i < TARGETS.length; i++) {
    const target = TARGETS[i];
    console.log(`\n[${i + 1}/${TARGETS.length}] ${target.competitor}/${target.page}`);
    console.log("-".repeat(40));
    await runMirror(target);
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log(`\n✅ BATCH COMPLETE in ${elapsed} minutes`);
  console.log(`   Captured ${TARGETS.length} pages\n`);
}

main();
