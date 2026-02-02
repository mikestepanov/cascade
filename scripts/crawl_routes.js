import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

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
  "platform",
  "integrations",
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

// Usage: node scripts/crawl_routes.js <URL> <competitor> [--auth google|linear]
const args = process.argv.slice(2);
const baseUrl = args[0];
const competitorName = args[1];

let authProvider = null;
const authIndex = args.indexOf("--auth");
if (authIndex !== -1 && args[authIndex + 1]) {
  authProvider = args[authIndex + 1];
}

if (!baseUrl || !competitorName) {
  console.error("Usage: node scripts/crawl_routes.js <url> <competitor> [--auth provider]");
  process.exit(1);
}

// Helper: Establish Google Auth (reuse from mirror script logic)
async function handleGoogleAuth(page) {
  console.log("   🔍 Detecting Google Auth elements...");
  const googleButtons = [
    'button:has-text("Continue with Google")',
    'button:has-text("Sign in with Google")',
    'a:has-text("Continue with Google")',
    'a:has-text("Sign in with Google")',
    '[aria-label*="Google"]',
    'svg[viewBox*="0 0 48 48"]',
  ];

  for (const selector of googleButtons) {
    const btn = await page.$(selector);
    if (btn && (await btn.isVisible())) {
      console.log(`      Found Google login button via: ${selector}`);
      await btn.click();
      await page.waitForTimeout(3000);
      break;
    }
  }

  if (page.url().includes("accounts.google.com")) {
    console.log("      Detected Google Account Selection page...");
    const accountSelector = '[data-authuser="0"]';
    try {
      if (await page.$(accountSelector)) {
        console.log("      Selecting primary Google account...");
        await page.click(accountSelector);
      }
      await page.waitForTimeout(5000);
    } catch (err) {
      console.log(`      ⚠️ Could not auto-select: ${err.message}`);
    }
  }
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
      const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
      for (const match of matches) {
        urlsFromSitemap.push(match[1]);
      }
      if (urlsFromSitemap.length > 0) break;
    } catch (_err) {}
  }
  return urlsFromSitemap;
}

async function discoverInternalRoutes(page) {
  console.log("   🔍 Scanning for internal high-value links...");
  return await page.evaluate(() => {
    const keywords = [
      "settings",
      "profile",
      "billing",
      "workspace",
      "team",
      "members",
      "usage",
      "plan",
      "account",
      "org",
      "projects",
      "notifications",
    ];
    const links = Array.from(document.querySelectorAll("a"));
    const found = [];
    const seen = new Set();
    for (const link of links) {
      const url = link.href;
      const text = link.innerText.toLowerCase().trim();
      if (!url.startsWith(window.location.origin)) continue;
      if (seen.has(url)) continue;
      if (keywords.some((kw) => text.includes(kw) || url.toLowerCase().includes(kw))) {
        found.push({ url, text: text.slice(0, 30) });
        seen.add(url);
      }
    }
    return found;
  });
}

async function main() {
  console.log(`\n🕵️ Starting route discovery for ${competitorName}...\n`);

  const results = new Set();

  // 1. Sitemap & Public Probes
  console.log("📜 Step 1: Parsing Sitemap & Standard SaaS Routes...");
  const sitemapUrls = await parseSitemap(baseUrl);
  sitemapUrls.forEach((u) => {
    results.add(u);
  });

  COMMON_SAAS_ROUTES.forEach((route) => {
    const full = baseUrl.endsWith("/") ? baseUrl + route.slice(1) : baseUrl + route;
    results.add(full);
  });

  // 2. Authenticated Crawl (If requested)
  if (authProvider) {
    console.log(`🔐 Step 2: Authenticated Crawl (${authProvider})...`);
    const browser = await chromium.launch({ headless: true });
    const authPath = path.resolve(__dirname, `../e2e/.auth/${authProvider}.json`);

    const contextOptions = {
      viewport: { width: 1280, height: 720 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    };

    if (fs.existsSync(authPath)) {
      contextOptions.storageState = authPath;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    try {
      await page.goto(baseUrl, { waitUntil: "load", timeout: 60000 });

      // Handle login handshake if we land on a login page
      if (page.url().includes("login") || page.url().includes("auth")) {
        await handleGoogleAuth(page);
      }

      await page.waitForTimeout(5000);
      const internal = await discoverInternalRoutes(page);
      internal.forEach((item) => {
        results.add(item.url);
      });

      // Scan common settings areas specifically if found
      const dashboardUrl = page.url();
      results.add(dashboardUrl);
      console.log(`      Found dashboard at: ${dashboardUrl}`);
    } catch (err) {
      console.error(`      ❌ Auth crawl failed: ${err.message}`);
    } finally {
      await browser.close();
    }
  }

  // 3. Consolidate & Score
  console.log("\n📊 Consolidating results...");
  const rawList = Array.from(results)
    .filter((url) => !url.includes("#") && !url.includes("javascript:"))
    .map((url) => {
      const score = HIGH_VALUE_KEYWORDS.reduce(
        (acc, kw) => acc + (url.toLowerCase().includes(kw) ? 1 : 0),
        0,
      );
      return {
        url,
        competitor: competitorName,
        page: url.split("/").filter(Boolean).pop()?.split("?")[0] || "homepage",
        score,
      };
    });

  // Smart Sampling & Deduplication
  const uniqueUrls = new Map();
  rawList.forEach((item) => {
    if (!uniqueUrls.has(item.url)) uniqueUrls.set(item.url, item);
  });

  const finalTargets = Array.from(uniqueUrls.values());

  const outputPath = path.resolve(
    __dirname,
    `../docs/research/library/${competitorName}_discovery.json`,
  );
  fs.writeFileSync(outputPath, JSON.stringify(finalTargets, null, 2));

  console.log(`\n✅ Discovery complete. Found ${finalTargets.length} targets.`);
  console.log(`📂 Saved to: ${outputPath}\n`);
}

main();
