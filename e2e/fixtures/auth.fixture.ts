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

function getAuthStatePath(workerIndex = 0): string {
  return path.join(AUTH_DIR, path.basename(AUTH_PATHS.teamLead(workerIndex)));
}

function loadDashboardConfig(workerIndex = 0): { companySlug: string; email: string } | null {
  try {
    const configPath = path.join(AUTH_DIR, `dashboard-config-${workerIndex}.json`);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // Ignore errors
  }
  return null;
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
  storageState: async ({}, use, testInfo) => {
    let state: any;
    try {
      const authPath = getAuthStatePath(testInfo.parallelIndex);
      if (fs.existsSync(authPath)) {
        const content = fs.readFileSync(authPath, "utf-8");
        state = JSON.parse(content);
      }
    } catch (e) {
      console.log(`⚠️ Auth state unavailable. Error: ${(e as Error).message}`);
    }
    await use(state);
  },

  skipAuthSave: [false, { option: true }],

  ensureAuthenticated: async ({ page, companySlug }, use, testInfo) => {
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

        // Wait for signin page to be ready
        await page.goto(`${baseURL}/signin`);
        await page.waitForLoadState("domcontentloaded");

        // Dynamically construct the worker-specific user to ensure isolation
        // This matches the logic in global-setup.ts
        const workerSuffix = `w${testInfo.parallelIndex}`;
        const workerUser = {
          ...TEST_USERS.teamLead,
          email: `e2e-teamlead-${workerSuffix}@inbox.mailtrap.io`,
        };

        console.log(`  🔐 ensureAuthenticated: Re-authenticating as ${workerUser.email}...`);
        await trySignInUser(page, baseURL, workerUser);

        // Stabilize and verify we are actually on dashboard
        await page.goto(dashboardUrl);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(3000); // Give Convex time to hydrate

        const finalUrl = page.url();
        if (!(finalUrl.includes("/dashboard") || finalUrl.includes("/onboarding"))) {
          console.error(`  ❌ ensureAuthenticated failed. Still at: ${finalUrl}`);
          throw new Error("Failed to ensure authentication after retry.");
        }

        // Save the new state so subsequent tests don't have to re-auth
        const currentState = await page.context().storageState();
        const authPath = getAuthStatePath(testInfo.parallelIndex);
        fs.writeFileSync(authPath, JSON.stringify(currentState, null, 2));

        console.log("  ✅ ensureAuthenticated: SUCCESS (Saved state)");
      }
    };
    await use(reauth);
  },

  saveAuthState: async ({ context, skipAuthSave }, use, testInfo) => {
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
            const authPath = getAuthStatePath(testInfo.parallelIndex);
            fs.writeFileSync(authPath, JSON.stringify(currentState, null, 2));
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

  companySlug: async ({}, use, testInfo) => {
    const config = loadDashboardConfig(testInfo.parallelIndex);
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
