import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const FRESHNESS_DAYS = parseInt(args.find((a) => a.startsWith("--days="))?.split("=")[1], 10) || 7;
const COMPETITOR_FILTER = args.find((a) => a.startsWith("--competitor="))?.split("=")[1];

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
    const args = [scriptPath, target.url, target.competitor, target.page];
    if (FORCE) args.push("--force");
    if (target.auth) {
      args.push("--auth");
      args.push(target.auth);
    }

    const child = spawn("node", args, {
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
    `   Capturing pages from ${[...new Set(TARGETS.map((t) => t.competitor))].length} competitors\n`,
  );
  console.log(`${"=".repeat(60)}\n`);

  const startTime = Date.now();

  // 1. Identify distinct competitors
  let competitors = [...new Set(TARGETS.map((t) => t.competitor))];

  if (COMPETITOR_FILTER) {
    console.log(`   🎯 Filtered to competitor: ${COMPETITOR_FILTER}`);
    competitors = competitors.filter((c) => c === COMPETITOR_FILTER);
  }

  const finalRunList = [];

  // 2. Build Run List (Prioritize JSON targets)
  for (const comp of competitors) {
    const targetsPath = path.resolve(__dirname, `../docs/research/library/${comp}_targets.json`);

    if (fs.existsSync(targetsPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
        if (Array.isArray(json) && json.length > 0) {
          console.log(`   ✅ Loaded ${json.length} selected targets for ${comp}`);
          finalRunList.push(...json);
          continue; // Skip hardcoded for this competitor
        }
      } catch (_e) {
        console.error(`   ⚠️ Error reading targets for ${comp}, falling back to defaults.`);
      }
    }

    // Fallback: Add hardcoded targets for this competitor
    const defaults = TARGETS.filter((t) => t.competitor === comp);
    // console.log(`   ℹ️ Using ${defaults.length} default targets for ${comp}`);
    finalRunList.push(...defaults);
  }

  console.log(`\n   📋 Final Run List: ${finalRunList.length} pages`);
  console.log(`${"=".repeat(60)}\n`);

  // 3. Execute
  for (let i = 0; i < finalRunList.length; i++) {
    const target = finalRunList[i];

    try {
      // Smart Skip & Staleness Check
      const outputDir = path.resolve(__dirname, "../docs/research/library", target.competitor);
      const deepDataPath = path.join(outputDir, `${target.page}_deep.json`);

      let shouldSkip = false;
      let reason = "";

      if (!FORCE && fs.existsSync(deepDataPath)) {
        try {
          const deepData = JSON.parse(fs.readFileSync(deepDataPath, "utf-8"));
          if (deepData.scrapedAt) {
            const lastScrape = new Date(deepData.scrapedAt);
            const now = new Date();
            const diffDays = (now - lastScrape) / (1000 * 60 * 60 * 24);

            if (diffDays < FRESHNESS_DAYS) {
              shouldSkip = true;
              reason = `Fresh (${Math.floor(diffDays)}d ago)`;
            }
          } else {
            // If no timestamp but file exists, treat as "old" but not necessarily stale
            // unless we want to be strict. For now, let's just skip if it exists at all.
            shouldSkip = true;
            reason = "Exists";
          }
        } catch (_e) {
          // ignore parse error, re-scrape
        }
      }

      const progress = `[${i + 1}/${finalRunList.length}]`;

      if (shouldSkip) {
        console.log(`\n${progress} ${target.competitor}/${target.page} ⏩ Skipped (${reason})`);
        continue;
      }

      console.log(`\n${progress} ${target.competitor}/${target.page}`);
      console.log("-".repeat(40));
      await runMirror(target);
    } catch (err) {
      console.error(`❌ Unexpected error processing ${target.competitor}:`, err);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n✅ BATCH COMPLETE in ${elapsed} minutes`);
  console.log(`   Captured ${finalRunList.length} pages\n`);
}

main();
