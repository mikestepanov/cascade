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
  const browser = await chromium.launch({ headless: false }); // Headed for manual intervention if needed
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://accounts.google.com/signin");

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
  await page.waitForURL("https://myaccount.google.com/**", { timeout: 120000 }).catch(() => {
    console.log("⚠️  Warning: Login did not redirect to MyAccount. Check if you are logged in.");
  });

  const statePath = path.join(AUTH_DIR, "google.json");
  await context.storageState({ path: statePath });
  console.log(`✅ Google session saved to ${statePath}`);

  await browser.close();
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
