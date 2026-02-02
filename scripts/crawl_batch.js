import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPETITORS = [
  { id: "linear", url: "https://linear.app" },
  { id: "clickup", url: "https://clickup.com" },
  { id: "notion", url: "https://www.notion.so" },
  { id: "asana", url: "https://asana.com" },
  { id: "fireflies", url: "https://fireflies.ai" },
  { id: "gong", url: "https://gong.io" },
  { id: "jira", url: "https://www.atlassian.com/software/jira" },
  { id: "meeting-baas", url: "https://meetingbaas.com" },
  { id: "monday", url: "https://monday.com" },
  { id: "otter", url: "https://otter.ai" },
  { id: "read-ai", url: "https://read.ai" },
  { id: "recall-ai", url: "https://recall.ai" },
  { id: "tldv", url: "https://tldv.io" },
  { id: "height", url: "https://height.app" },
  { id: "shortcut", url: "https://shortcut.com" },
  { id: "clockify", url: "https://clockify.me" },
  { id: "jibble", url: "https://jibble.io" },
  { id: "toggl", url: "https://toggl.com" },
  { id: "timecamp", url: "https://timecamp.com" },
  { id: "tmetric", url: "https://tmetric.com" },
  { id: "harvest", url: "https://getharvest.com" },
];

async function runCrawl(competitor) {
  return new Promise((resolve, reject) => {
    console.log(`\n🌊 Starting batch crawl for ${competitor.id}...`);

    // Using the same node process to run the script
    const scriptPath = path.join(__dirname, "crawl_routes.js");
    const args = [scriptPath, competitor.url, competitor.id];

    // Inherit stdio to see output in real-time
    const child = spawn("node", args, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(`❌ Crawl failed for ${competitor.id} (Exit code: ${code})`);
        resolve(); // Continue batch even if one fails
      }
    });

    child.on("error", (err) => {
      console.error(`❌ Error spawning crawl for ${competitor.id}: ${err.message}`);
      resolve();
    });
  });
}

async function main() {
  console.log(`\n🚀 STARTING BATCH ROUTE DISCOVERY (${COMPETITORS.length} competitors)`);
  console.log("=".repeat(60));

  const start = Date.now();

  for (const competitor of COMPETITORS) {
    await runCrawl(competitor);
  }

  const duration = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log(`✅ ALL CRAWLS COMPLETE in ${duration} minutes.`);
}

main();
