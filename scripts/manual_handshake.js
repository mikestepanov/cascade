import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, "../e2e/.auth");

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

async function main() {
  console.log("\n🚀 MANUAL AUTH HANDSHAKE");
  console.log("--------------------------------------------------");
  console.log("1. A headed browser will open shortly.");
  console.log("2. Please log in to your Google account manually.");
  console.log("3. Once you reach your Google Account or Gmail page, stay there.");
  console.log("4. I will detect the login and save your session.");
  console.log("--------------------------------------------------\n");

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  await page.goto("https://accounts.google.com/signin");

  console.log("⏳ Waiting for you to finish login...");

  try {
    // Wait for the user to reach a logged-in URL
    // We'll wait up to 10 minutes and check for common landing pages
    console.log("⏳ Monitoring for landing page (My Account or Gmail)...");

    await Promise.race([
      page.waitForURL("https://myaccount.google.com/**", { timeout: 600000 }),
      page.waitForURL("https://mail.google.com/**", { timeout: 600000 }),
      page.waitForURL("https://www.google.com/**", { timeout: 600000 }), // Catch-all for basic search login
    ]);

    console.log("\n✅ Login detected!");

    // Extra wait to ensure cookies are settled
    await page.waitForTimeout(2000);

    const statePath = path.join(AUTH_DIR, "google.json");
    await context.storageState({ path: statePath });

    console.log(`📂 Session saved to: ${statePath}`);
    console.log("\n✨ You can close the browser now.");

    await page.waitForTimeout(5000); // Give user time to see the message
  } catch (err) {
    console.error("\n❌ Timeout or Error:", err.message);
  } finally {
    await browser.close();
  }
}

main();
