import { test as base, expect } from "@playwright/test";
import path from "node:path";
import { AuthPage, DashboardPage } from "../pages";

/**
 * Authentication fixtures for tests requiring logged-in state
 *
 * Setup:
 * 1. Run `pnpm e2e:setup-auth` to create auth state
 * 2. Use `authenticatedTest` instead of `test`
 *
 * @see https://playwright.dev/docs/auth
 */

const AUTH_DIR = path.join(__dirname, "../.auth");
const AUTH_STATE_PATH = path.join(AUTH_DIR, "user.json");

export type AuthFixtures = {
  authPage: AuthPage;
  dashboardPage: DashboardPage;
};

/**
 * Test fixture that uses saved authentication state
 * Tests will start already logged in
 */
export const authenticatedTest = base.extend<AuthFixtures>({
  // Use saved storage state (cookies, localStorage)
  storageState: AUTH_STATE_PATH,

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

/**
 * Interactive setup to create auth state
 * Opens browser for manual login, then saves state
 *
 * Run with: `pnpm e2e:setup-auth`
 */
export async function setupAuthState(): Promise<void> {
  const { chromium } = await import("@playwright/test");
  const fs = await import("node:fs");
  const readline = await import("node:readline");

  // Ensure .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  console.log("╔════════════════════════════════════════════╗");
  console.log("║  Playwright Auth State Setup               ║");
  console.log("╚════════════════════════════════════════════╝\n");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Opening browser...\n");
  console.log("Instructions:");
  console.log("  1. Sign in with your test account");
  console.log("  2. Wait for the dashboard to load");
  console.log("  3. Press Enter in this terminal\n");

  await page.goto("http://localhost:5173");

  // Wait for user to complete login
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise<void>((resolve) => {
    rl.question("Press Enter after logging in... ", () => {
      rl.close();
      resolve();
    });
  });

  // Save auth state
  await context.storageState({ path: AUTH_STATE_PATH });

  console.log(`\n✓ Auth state saved to: ${AUTH_STATE_PATH}`);
  console.log("  You can now run authenticated tests.\n");

  await browser.close();
}

export { expect };
