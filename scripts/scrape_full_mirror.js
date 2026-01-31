import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

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

// Multi-shot configuration
const VIEWPORTS = [
  { name: "desktop", width: 1920, height: 1080 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "phablet", width: 768, height: 1024 },
  { name: "tablet", width: 1024, height: 1366 },
  { name: "mobile", width: 375, height: 667 },
  { name: "ultrawide", width: 3440, height: 1440 },
];

const THEMES = ["light", "dark"];

(async () => {
  console.log(`\n🪞 Total Mirror Capture: ${competitor}/${pageName}`);
  console.log(`   URL: ${targetUrl}\n`);

  const outputDir = path.resolve(__dirname, "../docs/research/library", competitor);
  const assetsDir = path.join(outputDir, "assets");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create subdirectories for assets
  for (const subdir of ["js", "css", "fonts", "images", "animations"]) {
    fs.mkdirSync(path.join(assetsDir, subdir), { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // Main technical capture (default Desktop Light)
  const technicalContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: "light",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  });
  const techPage = await technicalContext.newPage();

  // Collect network requests
  const networkLog = [];
  techPage.on("response", async (response) => {
    const url = response.url();
    const request = response.request();
    networkLog.push({
      url,
      status: response.status(),
      type: request.resourceType(),
      size: (await response.body().catch(() => Buffer.alloc(0))).length,
    });
  });

  console.log("📡 Navigating for technical capture (120s timeout)...");
  try {
    await techPage.goto(targetUrl, { waitUntil: "load", timeout: 120000 });
    // Attempt networkidle but don't crash if it stays busy
    await techPage.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      // ignore
    });
    await techPage.waitForTimeout(5000); // Buffer for animations
  } catch (err) {
    console.log(`   ⚠️ Navigation warning: ${err.message.split("\n")[0]}`);
  }

  // Extract HTML
  const html = await techPage.content();
  fs.writeFileSync(path.join(outputDir, `${pageName}.html`), html);
  console.log(`✅ Saved ${pageName}.html`);

  // Extract deep data
  const deepData = await techPage.evaluate(() => {
    // CSS Variables
    const cssVars = {};
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.style) {
              for (const prop of rule.style) {
                if (prop.startsWith("--")) {
                  cssVars[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
        } catch (_e) {
          // ignore
        }
      }
    } catch (_e) {
      // ignore
    }

    const keyframes = [];
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
              keyframes.push({ name: rule.name, cssText: rule.cssText });
            }
          }
        } catch (_e) {
          // ignore
        }
      }
    } catch (_e) {
      // ignore
    }

    const fonts = [];
    try {
      document.fonts.forEach((f) => {
        fonts.push({ family: f.family, status: f.status, style: f.style, weight: f.weight });
      });
    } catch (_e) {
      // ignore
    }

    const scripts = Array.from(document.scripts)
      .map((s) => s.src)
      .filter(Boolean);

    return { cssVars, keyframes, fonts, scripts };
  });

  fs.writeFileSync(
    path.join(outputDir, `${pageName}_deep.json`),
    JSON.stringify(deepData, null, 2),
  );
  console.log(`✅ Saved ${pageName}_deep.json`);

  await technicalContext.close();

  // --- Visual Multi-Shot (12-shot) ---
  console.log("\n📸 Starting 12-shot visual capture...");
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      const fileName = `${pageName}_${vp.name}_${theme}.png`;
      const filePath = path.join(outputDir, fileName);

      process.stdout.write(`   Capture: ${vp.name} (${theme})... `);

      const shotContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      });
      const shotPage = await shotContext.newPage();

      try {
        await shotPage.goto(targetUrl, { waitUntil: "load", timeout: 90000 });
        await shotPage.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
          // ignore
        });
        await shotPage.waitForTimeout(3000); // Stable render
        await shotPage.screenshot({ path: filePath, fullPage: true });
        process.stdout.write("✅\n");
      } catch (err) {
        process.stdout.write(`❌ (${err.message.split("\n")[0]})\n`);
      } finally {
        await shotContext.close();
      }
    }
  }

  // Assets download (from technical page)
  console.log("\n📥 Downloading assets...");
  const manifest = { js: [], css: [], fonts: [], images: [], animations: [] };
  let downloaded = 0;
  let _skipped = 0;

  for (const entry of networkLog) {
    const category = categorizeAsset(entry.url, entry.type);
    if (!category) {
      _skipped++;
      continue;
    }

    try {
      const urlObj = new URL(entry.url);
      const filename =
        path.basename(urlObj.pathname) || `file_${downloaded}${getExtension(entry.url)}`;
      const destPath = path.join(assetsDir, category, filename);

      if (fs.existsSync(destPath)) {
        _skipped++;
        continue;
      }

      await downloadFile(entry.url, destPath);
      manifest[category].push({ url: entry.url, local: `assets/${category}/${filename}` });
      downloaded++;
    } catch (_err) {
      _skipped++;
    }
  }

  fs.writeFileSync(
    path.join(outputDir, `${pageName}_manifest.json`),
    JSON.stringify(manifest, null, 2),
  );
  fs.writeFileSync(
    path.join(outputDir, `${pageName}_network.json`),
    JSON.stringify(networkLog, null, 2),
  );
  console.log(`✅ Saved ${pageName}_manifest.json and ${pageName}_network.json`);

  await browser.close();
  console.log(`\n🎉 Mirror complete: ${outputDir}/${pageName}.*\n`);
})();
