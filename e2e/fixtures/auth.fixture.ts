import { test as base } from "@playwright/test";
import { AuthPage, DashboardPage } from "../pages";
import path from "node:path";

/**
 * Test fixtures for authenticated user tests
 *
 * Usage:
 * 1. Run `pnpm e2e:setup-auth` to create auth state (manual login)
 * 2. Tests using `authenticatedTest` will reuse that state
 *
 * See: https://playwright.dev/docs/auth
 */

const AUTH_STATE_PATH = path.join(__dirname, "../.auth/user.json");

type AuthFixtures = {
  authPage: AuthPage;
  dashboardPage: DashboardPage;
};

/**
 * Test fixture that uses saved authentication state
 * Requires running auth setup first
 */
export const authenticatedTest = base.extend<AuthFixtures>({
  // Use saved auth state
  storageState: AUTH_STATE_PATH,

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

/**
 * Setup function to create auth state interactively
 * Run with: pnpm e2e:setup-auth
 */
export async function setupAuthState() {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Opening browser for manual login...");
  console.log("Please sign in with your test account.");
  console.log("Press Enter in the terminal when done.\n");

  await page.goto("http://localhost:5173");

  // Wait for user to complete login
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise<void>((resolve) => {
    rl.question("Press Enter after logging in...", () => {
      rl.close();
      resolve();
    });
  });

  // Save auth state
  await context.storageState({ path: AUTH_STATE_PATH });
  console.log(`\nAuth state saved to ${AUTH_STATE_PATH}`);

  await browser.close();
}

export { expect } from "@playwright/test";
