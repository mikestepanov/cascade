import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usage: node scripts/scrape_full_mirror.js <URL> <competitor> <page>
// Example: node scripts/scrape_full_mirror.js https://linear.app/homepage linear homepage
// Example: node scripts/scrape_full_mirror.js https://linear.app/features linear features
const [, , targetUrl, competitor, pageName] = process.argv;

if (!(targetUrl && competitor && pageName)) {
  console.error("Usage: node scripts/scrape_full_mirror.js <URL> <competitor> <page>");
  console.error(
    "Example: node scripts/scrape_full_mirror.js https://linear.app/features linear features",
  );
  process.exit(1);
}

// Helper: Download a file
// biome-ignore lint/suspicious/useAwait: returns Promise constructor
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        file.destroy(); // Ensure stream is closed before unlinking
        fs.unlink(destPath, () => {
          // ignore error
        });
        reject(err);
      });
  });
}

// Helper: Get file extension from URL
function getExtension(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || ".bin";
  } catch {
    return ".bin";
  }
}

// Helper: Categorize asset
function categorizeAsset(url, initiatorType) {
  const ext = getExtension(url).toLowerCase();
  if ([".js", ".mjs"].includes(ext) || initiatorType === "script") return "js";
  if ([".css"].includes(ext) || initiatorType === "css") return "css";
  if ([".woff", ".woff2", ".ttf", ".otf", ".eot"].includes(ext)) return "fonts";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"].includes(ext)) return "images";
  if ([".json"].includes(ext) && url.includes("lottie")) return "animations";
  if ([".lottie"].includes(ext)) return "animations";
  return null;
}

(async () => {
  console.log(`\n🪞 Total Mirror Capture: ${competitor}/${pageName}`);
  console.log(`   URL: ${targetUrl}\n`);

  // Output structure: docs/research/library/<competitor>/
  const outputDir = path.resolve(__dirname, "../docs/research/library", competitor);
  const assetsDir = path.join(outputDir, "assets");

  // Create directories
  for (const subdir of ["js", "css", "fonts", "images", "animations"]) {
    fs.mkdirSync(path.join(assetsDir, subdir), { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Collect network requests
  const networkLog = [];
  page.on("response", async (response) => {
    const url = response.url();
    const request = response.request();
    networkLog.push({
      url,
      status: response.status(),
      type: request.resourceType(),
      size: (await response.body().catch(() => Buffer.alloc(0))).length,
    });
  });

  // Navigate
  console.log("📡 Navigating...");
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Wait for content
  await page.waitForTimeout(3000);

  // Scroll to trigger lazy loads
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  console.log(`📊 Captured ${networkLog.length} network requests`);

  // Extract HTML - named per page
  const html = await page.content();
  fs.writeFileSync(path.join(outputDir, `${pageName}.html`), html);
  console.log(`✅ Saved ${pageName}.html`);

  // Extract deep data
  const deepData = await page.evaluate(() => {
    // CSS Variables
    const cssVars = {};
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.style) {
              // biome-ignore lint/style/useForOf: style.length is index-based
              for (let i = 0; i < rule.style.length; i++) {
                const prop = rule.style[i];
                if (prop.startsWith("--")) {
                  cssVars[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
        } catch (_e) {
          /* CORS-blocked */
        }
      }
    } catch (_e) {
      /* CORS-blocked */
    }

    // Keyframes
    const keyframes = [];
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
              keyframes.push({
                name: rule.name,
                cssText: rule.cssText,
              });
            }
          }
        } catch (_e) {
          /* CORS-blocked */
        }
      }
    } catch (_e) {
      /* CORS-blocked */
    }

    // Fonts
    const fonts = [];
    try {
      document.fonts.forEach((f) =>
        fonts.push({
          family: f.family,
          status: f.status,
          style: f.style,
          weight: f.weight,
        }),
      );
    } catch (_e) {
      /* font API unavailable */
    }

    // Scripts
    const scripts = Array.from(document.scripts)
      .map((s) => s.src)
      .filter(Boolean);

    return { cssVars, keyframes, fonts, scripts };
  });

  // Named per page: homepage_deep.json, features_deep.json, etc.
  fs.writeFileSync(
    path.join(outputDir, `${pageName}_deep.json`),
    JSON.stringify(deepData, null, 2),
  );
  console.log(
    `✅ Saved ${pageName}_deep.json (${Object.keys(deepData.cssVars).length} CSS vars, ${deepData.keyframes.length} keyframes)`,
  );

  // Download assets (shared across pages)
  console.log("\n📥 Downloading assets...");
  const manifest = { js: [], css: [], fonts: [], images: [], animations: [] };
  let downloaded = 0;
  let skipped = 0;

  for (const entry of networkLog) {
    const category = categorizeAsset(entry.url, entry.type);
    if (!category) {
      skipped++;
      continue;
    }

    try {
      const urlObj = new URL(entry.url);
      const filename =
        path.basename(urlObj.pathname) || `file_${downloaded}${getExtension(entry.url)}`;
      const destPath = path.join(assetsDir, category, filename);

      // Skip if already downloaded (shared assets)
      if (fs.existsSync(destPath)) {
        skipped++;
        continue;
      }

      await downloadFile(entry.url, destPath);
      manifest[category].push({ url: entry.url, local: `assets/${category}/${filename}` });
      downloaded++;

      if (downloaded % 20 === 0) {
        console.log(`   Downloaded ${downloaded} assets...`);
      }
    } catch (_err) {
      skipped++;
    }
  }

  // Append to existing manifest or create new
  const manifestPath = path.join(outputDir, `${pageName}_manifest.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Downloaded ${downloaded} new assets (skipped ${skipped} existing/unknown)`);

  // Save network log per page
  fs.writeFileSync(
    path.join(outputDir, `${pageName}_network.json`),
    JSON.stringify(networkLog, null, 2),
  );
  console.log(`✅ Saved ${pageName}_network.json`);

  await browser.close();

  console.log(`\n🎉 Mirror complete: ${outputDir}/${pageName}.*`);
  console.log(`   Files: ${pageName}.html, ${pageName}_deep.json, ${pageName}_manifest.json\n`);
})();
