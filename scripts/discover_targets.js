import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keywords that indicate high-value pages for UI/UX research
const HIGH_VALUE_KEYWORDS = [
  "pricing",
  "features",
  "product",
  "solutions",
  "customers",
  "docs",
  "documentation",
  "about",
  "platform",
  "integrations",
];

// Usage: node scripts/discover_targets.js <competitor-url> <competitor-name>
const [, , baseUrl, competitorName] = process.argv;

if (!baseUrl || !competitorName) {
  console.error("Usage: node scripts/discover_targets.js <url> <competitor>");
  process.exit(1);
}

async function discover() {
  console.log(`\n🔍 Discovering targets for ${competitorName} (${baseUrl})...`);

  const sitemapUrls = [
    new URL("/sitemap.xml", baseUrl).href,
    new URL("/sitemap_index.xml", baseUrl).href,
    new URL("/sitemap-pages.xml", baseUrl).href,
  ];

  const discoveredPages = [];

  for (const sitemapUrl of sitemapUrls) {
    try {
      console.log(`   Checking ${sitemapUrl}...`);
      const response = await fetch(sitemapUrl);
      if (!response.ok) continue;

      const xml = await response.text();
      // Simple regex to extract <loc> URLs from sitemap
      const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
      for (const match of matches) {
        const url = match[1];
        const pageName = path.basename(new URL(url).pathname) || "home";

        // Score the page based on keywords
        const score = HIGH_VALUE_KEYWORDS.reduce((acc, keyword) => {
          return acc + (url.toLowerCase().includes(keyword) ? 1 : 0);
        }, 0);

        if (score > 0 || url === baseUrl || url === `${baseUrl}/`) {
          discoveredPages.push({
            url,
            competitor: competitorName,
            page: pageName || "home",
            score,
          });
        }
      }

      if (discoveredPages.length > 0) {
        console.log(`   ✅ Found ${discoveredPages.length} potential targets in ${sitemapUrl}`);
        break; // Stop at first successful sitemap
      }
    } catch (err) {
      console.error(`   ❌ Failed to fetch ${sitemapUrl}: ${err.message}`);
    }
  }

  // Fallback: If no sitemap found, just use the home page
  if (discoveredPages.length === 0) {
    console.log("   ⚠️ No sitemap found. Falling back to home page.");
    discoveredPages.push({
      url: baseUrl,
      competitor: competitorName,
      page: "home",
      score: 1,
    });
  }

  // Sort by score and take top 15
  const finalTargets = discoveredPages.sort((a, b) => b.score - a.score).slice(0, 15);

  const outputPath = path.resolve(
    __dirname,
    `../docs/research/library/${competitorName}_discovery.json`,
  );
  fs.writeFileSync(outputPath, JSON.stringify(finalTargets, null, 2));

  console.log(`\n🎉 Discovery complete. Saved ${finalTargets.length} targets to ${outputPath}\n`);
}

discover();
