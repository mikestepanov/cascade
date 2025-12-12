import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as base, expect } from "@playwright/test";
import { AUTH_PATHS, TEST_USERS } from "../config";
import {
  AuthPage,
  CalendarPage,
  DashboardPage,
  DocumentsPage,
  OnboardingPage,
  ProjectsPage,
  SettingsPage,
} from "../pages";
import { trySignInUser } from "../utils";

/**
 * Authentication fixtures for tests requiring logged-in state
 *
 * Auth state is automatically created in global-setup.ts
 * Tests will skip if auth state is missing or invalid
 *
 * IMPORTANT: Convex uses refresh tokens that are single-use. When a token is
 * refreshed, the old refresh token is invalidated. This fixture saves the
 * storage state after each test to preserve any refreshed tokens for subsequent tests.
 *
 * @see https://playwright.dev/docs/auth
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, "../.auth");
const AUTH_STATE_PATH = path.join(AUTH_DIR, path.basename(AUTH_PATHS.teamLead));
const DASHBOARD_CONFIG_PATH = path.join(AUTH_DIR, "dashboard-config.json");

/**
 * Load dashboard config (company slug, etc.)
 */
function loadDashboardConfig(): { companySlug: string; email: string } | null {
  try {
    if (fs.existsSync(DASHBOARD_CONFIG_PATH)) {
      const content = fs.readFileSync(DASHBOARD_CONFIG_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

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
  onboardingPage: OnboardingPage;
  projectsPage: ProjectsPage;
  calendarPage: CalendarPage;
  settingsPage: SettingsPage;
  saveAuthState: () => Promise<void>;
  ensureAuthenticated: () => Promise<void>;
  forceNewContext: boolean;
  /** Company slug for the default test user (from dashboard-config.json) */
  companySlug: string;
};

/**
 * Test fixture that uses saved authentication state
 * Tests will start already logged in
 * Skips tests if auth state doesn't exist or is invalid
 *
 * The fixture automatically saves storage state after each test to preserve
 * any refreshed tokens (Convex uses single-use refresh tokens).
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

  // Flag to skip auto-save for specific tests (e.g., onboarding tests that corrupt state)
  skipAuthSave: [false, { option: true }],

  // Re-authenticate if current tokens are invalid (e.g., after signout test)
  // Call this in beforeEach if your test might run after signout
  ensureAuthenticated: async ({ page, companySlug }, use) => {
    const reauth = async () => {
      // Navigate to check if we're authenticated (use company-scoped dashboard)
      const dashboardUrl = companySlug ? `/${companySlug}/dashboard` : "/";
      await page.goto(dashboardUrl);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);

      // Check current URL - if redirected away from dashboard, we need to re-auth
      const currentUrl = page.url();
      const needsReauth = !(
        currentUrl.includes("/dashboard") || currentUrl.includes("/onboarding")
      );

      if (needsReauth) {
        console.log("  🔄 ensureAuthenticated: redirected to signin, re-authenticating...");
        // Clear all storage to start fresh (removes any corrupted tokens)
        await page.context().clearCookies();
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });

        // Use shared sign-in helper
        const baseURL = page.url().split("/").slice(0, 3).join("/");
        await trySignInUser(page, baseURL, TEST_USERS.teamLead);
      }
    };
    await use(reauth);
  },

  // Save auth state after test - preserves refreshed tokens
  // Only saves if auth tokens are still present (skips if user signed out)
  saveAuthState: async ({ context, skipAuthSave }, use) => {
    const save = async () => {
      if (skipAuthSave) {
        return; // Skip saving for tests that opt out
      }
      try {
        // Get current state without saving to file first
        const currentState = await context.storageState();

        // Check if auth tokens are still present in localStorage
        const hasAuthTokens = currentState.origins?.some((origin) =>
          origin.localStorage?.some(
            (item) => item.name.includes("convexAuth") || item.name.includes("__convexAuth"),
          ),
        );

        // Only save if auth tokens exist (don't overwrite with signed-out state)
        if (hasAuthTokens) {
          await context.storageState({ path: AUTH_STATE_PATH });
        }
      } catch {
        // Ignore errors - context might be closed
      }
    };
    await use(save);
    // Auto-save after each test (unless skipAuthSave is true)
    await save();
  },

  // Company slug for the default test user (teamLead)
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture requires object destructuring pattern
  companySlug: async ({}, use, testInfo) => {
    const config = loadDashboardConfig();
    if (!config?.companySlug) {
      testInfo.skip(true, "Default user config not found. Global setup may have failed.");
    }
    await use(config?.companySlug || "");
  },

  authPage: async ({ page, saveAuthState: _saveAuthState }, use) => {
    await use(new AuthPage(page));
  },

  dashboardPage: async ({ page, saveAuthState: _saveAuthState }, use) => {
    await use(new DashboardPage(page));
  },

  documentsPage: async ({ page, saveAuthState: _saveAuthState }, use) => {
    await use(new DocumentsPage(page));
  },

  onboardingPage: async ({ page, saveAuthState: _saveAuthState }, use) => {
    await use(new OnboardingPage(page));
  },

  projectsPage: async ({ page, saveAuthState: _saveAuthState }, use) => {
    await use(new ProjectsPage(page));
  },

  calendarPage: async ({ page, saveAuthState: _saveAuthState }, use) => {
    await use(new CalendarPage(page));
  },

  settingsPage: async ({ page, saveAuthState: _saveAuthState }, use) => {
    await use(new SettingsPage(page));
  },
});

export { expect };
