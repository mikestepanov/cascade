import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define all target pages to mirror
const TARGETS = [
  // Linear
  { url: "https://linear.app", competitor: "linear", page: "home" },
  { url: "https://linear.app/features", competitor: "linear", page: "features" },
  { url: "https://linear.app/docs", competitor: "linear", page: "docs" },

  // ClickUp
  { url: "https://clickup.com", competitor: "clickup", page: "home" },
  { url: "https://clickup.com/pricing", competitor: "clickup", page: "pricing" },
  { url: "https://clickup.com/features", competitor: "clickup", page: "features" },

  // Notion
  { url: "https://www.notion.so", competitor: "notion", page: "home" },
  { url: "https://www.notion.so/product", competitor: "notion", page: "product" },
  { url: "https://www.notion.so/pricing", competitor: "notion", page: "pricing" },

  // Asana
  { url: "https://asana.com", competitor: "asana", page: "home" },

  // Fireflies
  { url: "https://fireflies.ai", competitor: "fireflies", page: "home" },

  // Gong
  { url: "https://gong.io", competitor: "gong", page: "home" },

  // Jira
  { url: "https://www.atlassian.com/software/jira", competitor: "jira", page: "home" },

  // MeetingBaas
  { url: "https://meetingbaas.com", competitor: "meeting-baas", page: "home" },

  // Monday
  { url: "https://monday.com", competitor: "monday", page: "home" },

  // Otter
  { url: "https://otter.ai", competitor: "otter", page: "home" },

  // Read AI
  { url: "https://read.ai", competitor: "read-ai", page: "home" },

  // Recall
  { url: "https://recall.ai", competitor: "recall-ai", page: "home" },

  // tl;dv
  { url: "https://tldv.io", competitor: "tldv", page: "home" },

  // PM Tools (New)
  { url: "https://height.app", competitor: "height", page: "home" },
  { url: "https://shortcut.com", competitor: "shortcut", page: "home" },

  // Time Tracking (New)
  { url: "https://clockify.me", competitor: "clockify", page: "home" },
  { url: "https://jibble.io", competitor: "jibble", page: "home" },
  { url: "https://toggl.com", competitor: "toggl", page: "home" },
  { url: "https://timecamp.com", competitor: "timecamp", page: "home" },
  { url: "https://tmetric.com", competitor: "tmetric", page: "home" },
  { url: "https://getharvest.com", competitor: "harvest", page: "home" },
];

// Run mirror script for each target sequentially
async function runMirror(target) {
  return new Promise((resolve, _reject) => {
    const scriptPath = path.join(__dirname, "scrape_full_mirror.js");
    const child = spawn("node", [scriptPath, target.url, target.competitor, target.page], {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
      shell: true,
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
  console.log(`${"=".repeat(60)}\n`);

  const startTime = Date.now();

  for (let i = 0; i < TARGETS.length; i++) {
    const target = TARGETS[i];

    try {
      // Smart Skip: Check if directory exists
      const outputDir = path.resolve(__dirname, "../docs/research/library", target.competitor);
      if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
        console.log(
          `\n[${i + 1}/${TARGETS.length}] ${target.competitor}/${target.page} ⏩ Skipped (Exists)`,
        );
        continue;
      }

      console.log(`\n[${i + 1}/${TARGETS.length}] ${target.competitor}/${target.page}`);
      console.log("-".repeat(40));
      await runMirror(target);
    } catch (err) {
      console.error(`❌ Unexpected error processing ${target.competitor}:`, err);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n✅ BATCH COMPLETE in ${elapsed} minutes`);
  console.log(`   Captured ${TARGETS.length} pages\n`);
}

main();
