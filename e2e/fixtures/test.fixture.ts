import { test as base } from "@playwright/test";
import { AuthPage, DashboardPage } from "../pages";

/**
 * Extended test fixtures with page objects
 */
type TestFixtures = {
  authPage: AuthPage;
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

export { expect } from "@playwright/test";
