import * as fs from "node:fs";
import { chromium } from "@playwright/test";

async function screenshotOnboarding() {
  // Create screenshots dir
  if (!fs.existsSync("e2e/screenshots")) {
    fs.mkdirSync("e2e/screenshots", { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to app (landing page since not logged in)
  await page.goto("http://localhost:5555");
  await page.waitForTimeout(3000);

  // Screenshot landing
  await page.screenshot({ path: "e2e/screenshots/01-landing.png" });
  console.log("Saved: 01-landing.png");

  // Wait for user to manually log in, or we can show what we have
  console.log("Screenshots saved to e2e/screenshots/");
  console.log("Browser will stay open for 30 seconds for manual testing...");

  await page.waitForTimeout(30000);
  await browser.close();
}

screenshotOnboarding().catch(console.error);
