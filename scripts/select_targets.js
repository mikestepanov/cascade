import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for selection
const CONFIG = {
  // Always include these specific pages if found
  CRITICAL_PAGES: [
    "homepage",
    "pricing",
    "about",
    "contact",
    "login",
    "signup",
    "signin",
    "register",
    "features",
  ],

  // Always include routes matching these patterns (App/Auth)
  PRIORITY_PATTERNS: [
    /login/,
    /signin/,
    /signup/,
    /register/,
    /auth/, // Auth
    /dashboard/,
    /app/,
    /settings/,
    /profile/,
    /billing/,
    /account/,
    /team/,
    /workspace/,
    /projects/, // App
  ],

  // Sampling limits for repetitive content
  SAMPLING: {
    DOCS: { pattern: /\/docs\/|\/documentation\/|\/help\//, limit: 10 },
    BLOG: { pattern: /\/blog\/|\/posts\/|\/news\//, limit: 5 },
    CHANGELOG: { pattern: /\/changelog\/|\/updates\/|\/releases\//, limit: 5 },
    INTEGRATIONS: { pattern: /\/integrations\/|\/apps\//, limit: 5 },
    LEGAL: { pattern: /\/legal\/|\/privacy|\/terms/, limit: 2 },
    CAREERS: { pattern: /\/careers\/|\/jobs\//, limit: 2 },
  },
};

const LIBRARY_DIR = path.resolve(__dirname, "../docs/research/library");

function selectTargets(competitor) {
  const discoveryPath = path.join(LIBRARY_DIR, `${competitor}_discovery.json`);
  const targetsPath = path.join(LIBRARY_DIR, `${competitor}_targets.json`);

  if (!fs.existsSync(discoveryPath)) {
    console.log(`⚠️ No discovery file found for ${competitor}. Skipping.`);
    return;
  }

  const allRoutes = JSON.parse(fs.readFileSync(discoveryPath, "utf-8"));

  console.log(`\n🔍 Processing ${competitor} (${allRoutes.length} discovered routes)...`);

  const selected = new Map();

  // Helper to add route
  const add = (route, reason) => {
    if (!selected.has(route.url)) {
      selected.set(route.url, { ...route, selectionReason: reason });
    }
  };

  // 1. Critical Pages (Exact Match on 'page' or 'url')
  allRoutes.forEach((route) => {
    if (CONFIG.CRITICAL_PAGES.includes(route.page.toLowerCase()) || route.page === "location") {
      // 'location' is often home in some sitemaps
      add(route, "Critical Page");
    }
  });

  // 2. Priority Patterns (Bucket & Limit)
  // Instead of auto-adding, we bucket them and pick the top N best scoring ones
  // or just the first N if scores are equal.
  // LIMIT: 15 Priority Pages Total
  const priorityBucket = [];
  allRoutes.forEach((route) => {
    try {
      const pathname = new URL(route.url).pathname;
      for (const pattern of CONFIG.PRIORITY_PATTERNS) {
        if (pattern.test(pathname.toLowerCase())) {
          priorityBucket.push({ ...route, reason: `Priority: ${pattern.toString()}` });
          break;
        }
      }
    } catch (_e) {}
  });

  // Sort priority bucket by score (desc) and take top 15
  priorityBucket
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .forEach((r) => {
      add(r, r.reason);
    });

  // 3. High Score (Top 20 only)
  // Ensure we get the main product pages that might not match specific patterns
  allRoutes
    .filter((r) => r.score >= 2 && !selected.has(r.url)) // Ensure not already picked
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .forEach((r) => {
      add(r, "High Score (Top 20)");
    });

  // 4. Smart Sampling
  // Create buckets for sampling categories
  const buckets = {};
  Object.keys(CONFIG.SAMPLING).forEach((k) => {
    buckets[k] = [];
  });

  allRoutes.forEach((route) => {
    if (selected.has(route.url)) return; // Skip if already selected

    for (const [key, config] of Object.entries(CONFIG.SAMPLING)) {
      if (config.pattern.test(route.url)) {
        buckets[key].push(route);
        break;
      }
    }
  });

  // Pick top N from each bucket
  for (const [key, config] of Object.entries(CONFIG.SAMPLING)) {
    const sorted = buckets[key].sort((a, b) => b.score - a.score); // Best scoring first
    const picks = sorted.slice(0, config.limit);
    picks.forEach((r) => {
      add(r, `Sample: ${key}`);
    });
  }

  // Convert to array and sort
  const finalTuple = Array.from(selected.values());

  // Sort by score (desc) then url (asc)
  finalTuple.sort((a, b) => b.score - a.score || a.url.localeCompare(b.url));

  fs.writeFileSync(targetsPath, JSON.stringify(finalTuple, null, 2));

  console.log(`✅ Selected ${finalTuple.length} targets for ${competitor}`);

  console.log(`📂 Saved to: ${targetsPath}`);
}

async function main() {
  const competitors = fs
    .readdirSync(LIBRARY_DIR)
    .filter((f) => f.endsWith("_discovery.json"))
    .map((f) => f.replace("_discovery.json", ""));

  if (competitors.length === 0) {
    console.log("No discovery files found. Run 'pnpm run crawl:batch' first.");
    return;
  }

  console.log(`Found discovery data for: ${competitors.join(", ")}`);

  for (const comp of competitors) {
    selectTargets(comp);
  }
}

main();
