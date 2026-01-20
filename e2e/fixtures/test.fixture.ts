import { test as base, expect } from "@playwright/test";
import { AuthPage, DashboardPage, LandingPage } from "../pages";

/**
 * Custom test fixtures with page objects
 *
 * For unauthenticated tests (landing, signin, signup).
 * These pages don't need a real orgSlug, so we use a placeholder.
 *
 * Usage:
 * ```ts
 * import { test, expect } from "./fixtures";
 *
 * test("my test", async ({ authPage, landingPage }) => {
 *   await landingPage.goto();
 *   await landingPage.clickGetStarted();
 *   // ...
 * });
 * ```
 */

// Public pages don't need org context, but BasePage now requires orgSlug.
// Use a placeholder that signals "no org context needed".
const PUBLIC_ORG_PLACEHOLDER = "__public__";

export type TestFixtures = {
  /** Landing page object for unauthenticated marketing page */
  landingPage: LandingPage;
  /** Auth page object for sign in/up flows */
  authPage: AuthPage;
  /** Dashboard page object for main app - NOT available in unauthenticated tests */
  dashboardPage: DashboardPage;
};

export const test = base.extend<TestFixtures>({
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page, PUBLIC_ORG_PLACEHOLDER));
  },

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page, PUBLIC_ORG_PLACEHOLDER));
  },

  dashboardPage: async ({ page }, use) => {
    // Dashboard requires real auth, but for unauthenticated tests we provide placeholder
    // Tests should use authenticatedTest fixture for dashboard access
    await use(new DashboardPage(page, PUBLIC_ORG_PLACEHOLDER));
  },
});

export { expect };
