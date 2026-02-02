import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keywords that indicate high-value pages for UI/UX research
const HIGH_VALUE_KEYWORDS = [
  "pricing",
  "feature",
  "product",
  "integrate",
  "api",
  "doc",
  "blog",
  "security",
  "enterprise",
  "about",
];

const COMMON_SAAS_ROUTES = [
  "/settings",
  "/settings/profile",
  "/settings/billing",
  "/settings/workspace",
  "/settings/team",
  "/dashboard",
  "/projects",
  "/members",
  "/billing",
  "/profile",
  "/account",
  "/organization",
  "/notifications",
];

// Usage: node scripts/discover_targets.js <competitor-url> <competitor-name>
const [, , baseUrl, competitorName] = process.argv;

if (!baseUrl || !competitorName) {
  console.error("Usage: node scripts/discover_targets.js <url> <competitor>");
  process.exit(1);
}

async function parseSitemap(url) {
  const sitemapCandidateUrls = [
    new URL("/sitemap.xml", url).href,
    new URL("/sitemap_index.xml", url).href,
    new URL("/sitemap-pages.xml", url).href,
  ];

  const urlsFromSitemap = [];

  for (const sitemapUrl of sitemapCandidateUrls) {
    try {
      console.log(`   Checking ${sitemapUrl}...`);
      const response = await fetch(sitemapUrl);
      if (!response.ok) continue;

      const xml = await response.text();
      // Simple regex to extract <loc> URLs from sitemap
      const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
      for (const match of matches) {
        urlsFromSitemap.push(match[1]);
      }

      if (urlsFromSitemap.length > 0) {
        console.log(`   ✅ Found ${urlsFromSitemap.length} URLs in ${sitemapUrl}`);
        break; // Stop at first successful sitemap
      }
    } catch (_err) {
      // console.error(`   ❌ Failed to fetch ${sitemapUrl}: ${err.message}`);
    }
  }
  return urlsFromSitemap;
}

async function discover() {
  console.log(`\n🔍 Discovering targets for ${competitorName} (${baseUrl})...`);

  // Combine Sitemap URLs with Common Probes
  const sitemapUrls = await parseSitemap(baseUrl);
  const probeUrls = COMMON_SAAS_ROUTES.map((route) =>
    baseUrl.endsWith("/") ? baseUrl + route.slice(1) : baseUrl + route,
  );

  const allCandidateUrls = [...new Set([...sitemapUrls, ...probeUrls])];
  const discoveredPages = [];

  for (const url of allCandidateUrls) {
    try {
      if (!url.startsWith(baseUrl)) continue;

      const score = HIGH_VALUE_KEYWORDS.reduce((acc, keyword) => {
        return acc + (url.toLowerCase().includes(keyword) ? 1 : 0);
      }, 0);

      // Score base common routes slightly higher to ensure they are captured if they exist
      const isCommonRoute = COMMON_SAAS_ROUTES.some((r) => url.endsWith(r));
      const finalScore = isCommonRoute ? score + 0.5 : score;

      if (finalScore > 0 || url === baseUrl || url === `${baseUrl}/`) {
        discoveredPages.push({
          url,
          competitor: competitorName,
          page:
            url === baseUrl || url === `${baseUrl}/`
              ? "homepage"
              : url.split("/").filter(Boolean).pop().split("?")[0],
          score: finalScore,
        });
      }
    } catch (_err) {
      // ignore invalid URLs if any
    }
  }

  // Fallback: If no pages found (e.g. no sitemap and probes failed), just use the home page
  if (discoveredPages.length === 0) {
    console.log("   ⚠️ No targets discovered. Falling back to home page.");
    discoveredPages.push({
      url: baseUrl,
      competitor: competitorName,
      page: "homepage",
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
