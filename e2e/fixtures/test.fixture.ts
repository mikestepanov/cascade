import { test as base, expect } from "@playwright/test";
import { AuthPage, DashboardPage, LandingPage } from "../pages";

/**
 * Custom test fixtures with page objects
 *
 * Usage:
 * ```ts
 * import { test, expect } from "./fixtures";
 *
 * test("my test", async ({ authPage, dashboardPage, landingPage }) => {
 *   await landingPage.goto();
 *   await landingPage.clickGetStarted();
 *   // ...
 * });
 * ```
 */

export type TestFixtures = {
  /** Landing page object for unauthenticated marketing page */
  landingPage: LandingPage;
  /** Auth page object for sign in/up flows */
  authPage: AuthPage;
  /** Dashboard page object for main app */
  dashboardPage: DashboardPage;
};

export const test = base.extend<TestFixtures>({
  landingPage: async ({ page }, use) => {
    const landingPage = new LandingPage(page);
    await use(landingPage);
  },

  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
});

export { expect };
