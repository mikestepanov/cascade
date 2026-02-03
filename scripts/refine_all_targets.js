import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIBRARY_DIR = path.resolve(__dirname, "../docs/research/library");
const DRY_RUN = !process.argv.includes("--apply");

// Config
const DOCS_CAP = 5;
const BLOG_CAP = 5;

// Helpers
function isLocalized(url) {
  return /\/(br|de|fr|it|ja|ko|nl|pl|ru|zh|es|zh-tw|pt)\//.test(url) || url.includes("/lang/");
}

function isIrrelevant(url) {
  const lower = url.toLowerCase();
  if (lower.includes("feature-request")) return true;
  if (lower.includes("/contact")) return true;
  if (lower.includes("/webinars")) return true;
  if (lower.includes("/events")) return true;
  return false;
}

function isOldHarvestBlog(url) {
  // Check for years 2007-2015 in URL path
  const match = url.match(/\/blog\/(\d{4})\//);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year < 2018) return true; // Keep last ~7-8 years
  }
  return false;
}

function processFile(filePath) {
  const filename = path.basename(filePath);
  const competitor = filename.replace("_targets.json", "");

  if (!fs.existsSync(filePath)) return;

  let targets = [];
  try {
    targets = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (_e) {
    console.error(`❌ Failed to parse ${filename}`);
    return;
  }

  const initialCount = targets.length;
  console.log(`\nProcessing ${competitor} (${initialCount} pages)...`);

  // 1. Basic Filter
  const filtered = targets.filter((t) => {
    const url = t.url.toLowerCase();

    if (isLocalized(url)) return false;
    if (isIrrelevant(url)) return false;

    if (competitor === "harvest" && isOldHarvestBlog(url)) return false;

    return true;
  });

  // 2. Categorize & Cap
  const categories = {
    docs: [],
    blog: [],
    marketing: [],
  };

  filtered.forEach((t) => {
    const url = t.url.toLowerCase();
    // Broad categorization
    if (
      url.includes("/documentation/") ||
      url.includes("/docs/") ||
      url.includes("/guides/") ||
      url.includes("/resources/") ||
      url.includes("/help/")
    ) {
      categories.docs.push(t);
    } else if (url.includes("/blog/") || url.includes("/changelog/") || url.includes("/news/")) {
      categories.blog.push(t);
    } else {
      categories.marketing.push(t);
    }
  });

  // Apply Caps (Sort by score first if available)
  const sortFn = (a, b) => (b.score || 0) - (a.score || 0);

  categories.docs.sort(sortFn);
  categories.blog.sort(sortFn);
  categories.marketing.sort(sortFn);

  const keptDocs = categories.docs.slice(0, DOCS_CAP);
  const keptBlog = categories.blog.slice(0, BLOG_CAP);

  // Clean Marketing (De-dupe)
  const uniqueMarketing = [];
  const seenUrls = new Set();
  categories.marketing.forEach((t) => {
    if (!seenUrls.has(t.url)) {
      uniqueMarketing.push(t);
      seenUrls.add(t.url);
    }
  });

  const finalList = [...uniqueMarketing, ...keptDocs, ...keptBlog];

  console.log(`   - Removed Localized/Legacy/Irrelevant: ${initialCount - filtered.length}`);
  console.log(`   - Docs: ${categories.docs.length} -> ${keptDocs.length}`);
  console.log(`   - Blog: ${categories.blog.length} -> ${keptBlog.length}`);
  console.log(`   - Marketing: ${categories.marketing.length} -> ${uniqueMarketing.length}`);
  console.log(`   ✅ Final Count: ${finalList.length} (was ${initialCount})`);

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, JSON.stringify(finalList, null, 2));
  }
}

function run() {
  console.log("🧹 Refining ALL Competitor Targets...");

  const files = fs.readdirSync(LIBRARY_DIR).filter((f) => f.endsWith("_targets.json"));

  for (const file of files) {
    processFile(path.join(LIBRARY_DIR, file));
  }

  if (DRY_RUN) {
    console.log("\nℹ️ Dry run complete. Use --apply to save changes.");
  } else {
    console.log("\n✅ All target lists updated.");
  }
}

run();
