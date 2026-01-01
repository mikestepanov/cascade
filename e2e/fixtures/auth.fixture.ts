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
  LandingPage,
  OnboardingPage,
  ProjectsPage,
  SettingsPage,
  WorkspacesPage,
} from "../pages";
import { trySignInUser } from "../utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, "../.auth");
const AUTH_STATE_PATH = path.join(AUTH_DIR, path.basename(AUTH_PATHS.teamLead));
const DASHBOARD_CONFIG_PATH = path.join(AUTH_DIR, "dashboard-config.json");

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

function isAuthStateValid(): boolean {
  if (!fs.existsSync(AUTH_STATE_PATH)) {
    return false;
  }
  try {
    const content = fs.readFileSync(AUTH_STATE_PATH, "utf-8");
    const state = JSON.parse(content);
    if (state.origins && Array.isArray(state.origins)) {
      for (const origin of state.origins) {
        if (origin.localStorage && Array.isArray(origin.localStorage)) {
          const hasAuthToken = origin.localStorage.some(
            (item: { name: string; value: string }) =>
              item.name.includes("auth") ||
              item.name.includes("token") ||
              item.name.includes("convex") ||
              item.name.includes("session"),
          );
          if (hasAuthToken) return true;
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
  landingPage: LandingPage;
  onboardingPage: OnboardingPage;
  projectsPage: ProjectsPage;
  workspacesPage: WorkspacesPage;
  calendarPage: CalendarPage;
  settingsPage: SettingsPage;
  saveAuthState: () => Promise<void>;
  ensureAuthenticated: () => Promise<void>;
  forceNewContext: boolean;
  companySlug: string;
  monitorAuthState: unknown;
  skipAuthSave: boolean;
};

export const authenticatedTest = base.extend<AuthFixtures>({
  storageState: async (_, use, _testInfo) => {
    let state: any;
    try {
      if (fs.existsSync(AUTH_STATE_PATH)) {
        const content = fs.readFileSync(AUTH_STATE_PATH, "utf-8");
        state = JSON.parse(content);
      }
    } catch (e) {
      console.log(`⚠️ Auth state unavailable. Error: ${(e as Error).message}`);
    }
    await use(state);
  },

  skipAuthSave: [false, { option: true }],

  ensureAuthenticated: async ({ page, companySlug }, use) => {
    const reauth = async () => {
      const dashboardUrl = companySlug ? `/${companySlug}/dashboard` : "/";
      await page.goto(dashboardUrl);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);
      const currentUrl = page.url();
      const needsReauth = !(
        currentUrl.includes("/dashboard") || currentUrl.includes("/onboarding")
      );
      if (needsReauth) {
        console.log("  🔄 ensureAuthenticated: re-authenticating...");
        await page.context().clearCookies();
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        const baseURL = page.url().split("/").slice(0, 3).join("/");
        await trySignInUser(page, baseURL, TEST_USERS.teamLead);
      }
    };
    await use(reauth);
  },

  saveAuthState: async ({ context, skipAuthSave }, use) => {
    const save = async () => {
      if (skipAuthSave) return;
      try {
        const currentState = await context.storageState();
        const hasAuthTokens = currentState.origins?.some((origin) =>
          origin.localStorage?.some(
            (item) => item.name.includes("convexAuth") || item.name.includes("__convexAuth"),
          ),
        );
        if (hasAuthTokens) {
          try {
            fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(currentState, null, 2));
          } catch (writeError) {
            console.warn("⚠️ Failed to save auth state.");
          }
        }
      } catch (e) {
        console.warn(`⚠️ Error in saveAuthState: ${(e as Error).message}`);
      }
    };
    await use(save);
    await save();
  },

  companySlug: async (_, use, testInfo) => {
    const config = loadDashboardConfig();
    if (!config?.companySlug) testInfo.skip(true, "Default user config not found.");
    await use(config?.companySlug || "");
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
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },
  workspacesPage: async ({ page }, use) => {
    await use(new WorkspacesPage(page));
  },
  calendarPage: async ({ page }, use) => {
    await use(new CalendarPage(page));
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },

  monitorAuthState: [
    async ({ ensureAuthenticated, page }: any, use: () => Promise<void>) => {
      await page.context().addInitScript(() => {
        try {
          Object.defineProperty(navigator, "onLine", { get: () => true });
        } catch {}
      });
      await ensureAuthenticated();
      await use();
    },
    { auto: true, scope: "test" },
  ],
});

export { expect };
