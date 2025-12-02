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
 * Auth state is automatically created in global-setup.ts
 * Tests will skip if auth state is missing or invalid
 *
 * @see https://playwright.dev/docs/auth
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, "../.auth");
const AUTH_STATE_PATH = path.join(AUTH_DIR, "user.json");

/**
 * Check if auth state file exists and has valid authentication content
 * We specifically look for Convex auth tokens, not just any cookies
 */
function isAuthStateValid(): boolean {
  if (!fs.existsSync(AUTH_STATE_PATH)) {
    return false;
  }

  try {
    const content = fs.readFileSync(AUTH_STATE_PATH, "utf-8");
    const state = JSON.parse(content);

    // Look for Convex auth-related localStorage entries
    // Convex stores auth tokens in localStorage
    if (state.origins && Array.isArray(state.origins)) {
      for (const origin of state.origins) {
        if (origin.localStorage && Array.isArray(origin.localStorage)) {
          // Look for any key that looks like auth token storage
          const hasAuthToken = origin.localStorage.some(
            (item: { name: string; value: string }) =>
              item.name.includes("auth") ||
              item.name.includes("token") ||
              item.name.includes("convex") ||
              item.name.includes("session"),
          );
          if (hasAuthToken) {
            return true;
          }
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

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
 * Skips tests if auth state doesn't exist or is invalid
 */
export const authenticatedTest = base.extend<AuthFixtures>({
  // Use saved storage state (cookies, localStorage) - only if valid
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture requires object destructuring pattern
  storageState: async ({}, use, testInfo) => {
    if (!isAuthStateValid()) {
      testInfo.skip(true, "Auth state not found or invalid. Global setup may have failed.");
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

export { expect };
