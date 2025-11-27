import { test as base, expect } from "@playwright/test";
import { AuthPage, DashboardPage } from "../pages";

/**
 * Custom test fixtures with page objects
 *
 * Usage:
 * ```ts
 * import { test, expect } from "./fixtures";
 *
 * test("my test", async ({ authPage, dashboardPage }) => {
 *   await authPage.goto();
 *   // ...
 * });
 * ```
 */

export type TestFixtures = {
  /** Auth page object for sign in/up flows */
  authPage: AuthPage;
  /** Dashboard page object for main app */
  dashboardPage: DashboardPage;
};

export const test = base.extend<TestFixtures>({
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
