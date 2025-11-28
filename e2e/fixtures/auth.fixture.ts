import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as base, expect } from "@playwright/test";
import {
  AuthPage,
  CalendarPage,
  DashboardPage,
  DocumentsPage,
  ProjectsPage,
  SettingsPage,
} from "../pages";

/**
 * Authentication fixtures for tests requiring logged-in state
 *
 * Setup:
 * 1. Run `pnpm e2e:setup-auth` to create auth state
 * 2. Use `authenticatedTest` instead of `test`
 *
 * @see https://playwright.dev/docs/auth
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, "../.auth");
const AUTH_STATE_PATH = path.join(AUTH_DIR, "user.json");

// Check if auth state exists
const authStateExists = fs.existsSync(AUTH_STATE_PATH);

export type AuthFixtures = {
  authPage: AuthPage;
  dashboardPage: DashboardPage;
  documentsPage: DocumentsPage;
  projectsPage: ProjectsPage;
  calendarPage: CalendarPage;
  settingsPage: SettingsPage;
};

/**
 * Test fixture that uses saved authentication state
 * Tests will start already logged in
 * Skips tests if auth state doesn't exist
 */
export const authenticatedTest = base.extend<AuthFixtures>({
  // Use saved storage state (cookies, localStorage) - only if file exists
  storageState: async (_baseFixtures, use, testInfo) => {
    if (!authStateExists) {
      testInfo.skip(true, "Auth state not found. Run: pnpm e2e:setup-auth");
    }
    await use(AUTH_STATE_PATH);
  },

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  documentsPage: async ({ page }, use) => {
    await use(new DocumentsPage(page));
  },

  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },

  calendarPage: async ({ page }, use) => {
    await use(new CalendarPage(page));
  },

  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
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

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(process.env.BASE_URL || "http://localhost:5555");

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

  await browser.close();
}

export { expect };
