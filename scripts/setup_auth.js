import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, "../e2e/.auth");
const SECRETS_PATH = path.resolve(__dirname, "../secrets.json");

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

async function setupGoogleAuth(credentials) {
  console.log("🔐 Starting Google Authentication...");
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Script to hide automation
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  try {
    await page.goto("https://accounts.google.com/signin", { waitUntil: "load" });

    // Fill email
    await page.fill('input[type="email"]', credentials.email);
    await page.click("#identifierNext");

    // Wait for password field and fill it
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
    await page.fill('input[type="password"]', credentials.password);
    await page.click("#passwordNext");

    console.log("⏳ Waiting for login to complete (solve 2FA if prompted)...");

    // Wait for navigation back to a logged-in state or a timeout
    // We'll wait up to 2 minutes for the user to handle any prompts
    await page
      .waitForURL("https://myaccount.google.com/**", { timeout: 120000 })
      .catch(async (err) => {
        console.log("⚠️  Warning: Login did not redirect to MyAccount. Taking debug screenshot.");
        await page.screenshot({ path: path.join(AUTH_DIR, "auth_timeout_debug.png") });
        throw err;
      });

    const statePath = path.join(AUTH_DIR, "google.json");
    await context.storageState({ path: statePath });
    console.log(`✅ Google session saved to ${statePath}`);
  } catch (err) {
    console.error("❌ Auth Error:", err.message);
    await page.screenshot({ path: path.join(AUTH_DIR, "auth_error_debug.png") });
    throw err;
  } finally {
    await browser.close();
  }
}

async function setupLinearAuth() {
  console.log("🔐 Starting Linear Authentication...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://linear.app/login");

  console.log("👋 Please log in to Linear manually in the opened browser.");
  console.log("⏳ Waiting for landing page...");

  // Wait for the workspace URL or a general success indicator
  await page.waitForURL("https://linear.app/**", { timeout: 120000 });

  const statePath = path.join(AUTH_DIR, "linear.json");
  await context.storageState({ path: statePath });
  console.log(`✅ Linear session saved to ${statePath}`);

  await browser.close();
}

async function main() {
  const provider = process.argv[2];
  if (!provider) {
    console.error("Usage: node scripts/setup_auth.js <google|linear>");
    process.exit(1);
  }

  if (!fs.existsSync(SECRETS_PATH)) {
    console.error("❌ secrets.json not found.");
    process.exit(1);
  }

  const secrets = JSON.parse(fs.readFileSync(SECRETS_PATH, "utf-8"));

  if (provider === "google") {
    if (!secrets.google) {
      console.error("❌ No Google credentials in secrets.json");
      process.exit(1);
    }
    await setupGoogleAuth(secrets.google);
  } else if (provider === "linear") {
    await setupLinearAuth();
  } else {
    console.error(`❌ Unknown provider: ${provider}`);
  }
}

main();
