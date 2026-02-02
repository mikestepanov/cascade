import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usage: node scripts/scrape_full_mirror.js <URL> <competitor> <page> [--auth google|linear]
// Example: node scripts/scrape_full_mirror.js https://linear.app/features linear features
// Example: node scripts/scrape_full_mirror.js https://linear.app/antigravity-research-lab linear dashboard --auth linear
const args = process.argv.slice(2);
const targetUrl = args[0];
const competitor = args[1];
const pageName = args[2];

let authProvider = null;
const authIndex = args.indexOf("--auth");
if (authIndex !== -1 && args[authIndex + 1]) {
  authProvider = args[authIndex + 1];
}

if (!(targetUrl && competitor && pageName)) {
  console.error(
    "Usage: node scripts/scrape_full_mirror.js <URL> <competitor> <page> [--auth provider]",
  );
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

// Helper: Handle Google OAuth Flow
async function handleGoogleAuth(page) {
  console.log("🔍 Detecting Google Auth elements...");

  // 1. Look for "Continue with Google" buttons on third-party sites
  const googleButtons = [
    'button:has-text("Continue with Google")',
    'button:has-text("Sign in with Google")',
    'a:has-text("Continue with Google")',
    'a:has-text("Sign in with Google")',
    '[aria-label*="Google"]',
    'svg[viewBox*="0 0 48 48"]', // Common Google G logo
  ];

  for (const selector of googleButtons) {
    const btn = await page.$(selector);
    if (btn && (await btn.isVisible())) {
      console.log(`   Found Google login button via: ${selector}`);
      await btn.click();
      await page.waitForTimeout(3000);
      break;
    }
  }

  // 2. Handle Google's Account Selection (if we land on accounts.google.com)
  if (page.url().includes("accounts.google.com")) {
    console.log("   Detected Google Account Selection page...");
    const accountSelector = '[data-authuser="0"]'; // First account
    const emailSelector = 'div[role="link"]';

    try {
      if (await page.$(accountSelector)) {
        console.log("   Selecting primary Google account...");
        await page.click(accountSelector);
      } else if (await page.$(emailSelector)) {
        console.log("   Selecting available email...");
        await page.click(emailSelector);
      }
      await page.waitForTimeout(5000); // Wait for redirect
    } catch (err) {
      console.log(`   ⚠️ Could not auto-select account: ${err.message}`);
    }
  }

  // 3. Wait for return to app
  try {
    await page.waitForLoadState("load", { timeout: 30000 });
    console.log(`✅ Handshake settled: ${page.url()}`);
  } catch (_err) {
    console.log("   ⚠️ Redirect taking longer than expected...");
  }
}

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
  const contextOptions = {
    viewport: { width: 1920, height: 1080 },
    colorScheme: "light",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    recordVideo: {
      dir: path.join(outputDir, "recording"),
      size: { width: 1280, height: 720 },
    },
  };

  if (authProvider) {
    const authPath = path.resolve(__dirname, `../e2e/.auth/${authProvider}.json`);
    if (fs.existsSync(authPath)) {
      console.log(`🔒 Loading auth session: ${authProvider}`);
      contextOptions.storageState = authPath;
    } else {
      console.warn(`⚠️ Auth state not found for ${authProvider}. Running without auth.`);
    }
  }

  const technicalContext = await browser.newContext(contextOptions);
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

    // Handle Google Auth if needed and requested
    const isLoginPage = techPage.url().includes("login") || techPage.url().includes("auth");
    if (authProvider === "google" && isLoginPage) {
      console.log("🔓 Login page detected. Attempting auto-auth...");
      await handleGoogleAuth(techPage);
    }

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

    // --- Tech Stack Fingerprinting ---
    const fingerprint = {
      frameworks: [],
      libraries: [],
      ui: [],
      analytics: [],
    };

    const docHtml = document.documentElement.innerHTML.toLowerCase();
    const _bodyText = document.body.innerText.toLowerCase();

    // Framework Detection
    if (window.React || document.querySelector("[data-reactroot]"))
      fingerprint.frameworks.push("React");
    if (window.next || docHtml.includes("__next")) fingerprint.frameworks.push("Next.js");
    if (window.Vue) fingerprint.frameworks.push("Vue");
    if (docHtml.includes("nuxt")) fingerprint.frameworks.push("Nuxt.js");
    if (docHtml.includes("webflow")) fingerprint.frameworks.push("Webflow");

    // UI & Styling Libraries
    if (docHtml.includes("tailwind")) fingerprint.ui.push("Tailwind CSS");
    if (docHtml.includes("radix-ui")) fingerprint.ui.push("Radix UI");
    if (docHtml.includes("framer-motion")) fingerprint.ui.push("Framer Motion");
    if (docHtml.includes("mantine")) fingerprint.ui.push("Mantine");
    if (docHtml.includes("chakra-ui")) fingerprint.ui.push("Chakra UI");
    if (docHtml.includes("shadcn")) fingerprint.ui.push("shadcn/ui");

    // Utilities
    if (window.LottieCompress || docHtml.includes("lottie")) fingerprint.libraries.push("Lottie");
    if (window.gsap) fingerprint.libraries.push("GSAP");

    // Analytics
    if (window.posthog) fingerprint.analytics.push("PostHog");
    if (window.ga || window.google_analytics) fingerprint.analytics.push("Google Analytics");
    if (window.mixpanel) fingerprint.analytics.push("Mixpanel");
    if (window.Intercom) fingerprint.analytics.push("Intercom");

    return { cssVars, keyframes, fonts, scripts, fingerprint, scrapedAt: new Date().toISOString() };
  });

  fs.writeFileSync(
    path.join(outputDir, `${pageName}_deep.json`),
    JSON.stringify(deepData, null, 2),
  );
  console.log(`✅ Saved ${pageName}_deep.json`);

  // --- Session Caching for Multi-shot ---
  let tempAuthState = null;
  if (authProvider) {
    const tempPath = path.resolve(__dirname, `../e2e/.auth/${competitor}_temp.json`);
    await technicalContext.storageState({ path: tempPath });
    tempAuthState = tempPath;
    console.log(`💾 Cached temporary ${competitor} session for visual capture.`);
  }

  await technicalContext.close();

  // --- Visual Multi-Shot (12-shot) ---
  console.log("\n📸 Starting 12-shot visual capture...");
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      const fileName = `${pageName}_${vp.name}_${theme}.png`;
      const filePath = path.join(outputDir, fileName);

      process.stdout.write(`   Capture: ${vp.name} (${theme})... `);

      const shotOptions = {
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      };

      if (tempAuthState) {
        shotOptions.storageState = tempAuthState;
      }

      const shotContext = await browser.newContext(shotOptions);
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

  // Move video file and rename it
  const videoDir = path.join(outputDir, "recording");
  if (fs.existsSync(videoDir)) {
    const files = fs.readdirSync(videoDir);
    if (files.length > 0) {
      const videoPath = path.join(videoDir, files[0]);
      const finalVideoPath = path.join(outputDir, `${pageName}_motion.webm`);
      fs.renameSync(videoPath, finalVideoPath);
      fs.rmSync(videoDir, { recursive: true, force: true });
      console.log(`✅ Saved ${pageName}_motion.webm`);
    }
  }

  // Cleanup temp auth state
  const tempPath = path.resolve(__dirname, `../e2e/.auth/${competitor}_temp.json`);
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }

  console.log(`\n🎉 Mirror complete: ${outputDir}/${pageName}.*\n`);
})();
