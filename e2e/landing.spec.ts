import { expect, test } from "./fixtures";

/**
 * Comprehensive Landing Page E2E Tests
 *
 * Tests all actionable elements on the landing page for unauthenticated users.
 */

test.describe("Landing Page - Navigation", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays all navigation elements", async ({ landingPage, page }) => {
    // Logo
    await expect(landingPage.navLogo).toBeVisible();

    // Navigation items (may be links or buttons depending on implementation)
    await expect(page.locator("nav").getByText("Features")).toBeVisible();
    await expect(page.locator("nav").getByText("Pricing")).toBeVisible();
    await expect(page.locator("nav").getByText("Resources")).toBeVisible();
    await expect(page.locator("nav").getByText("Sign in")).toBeVisible();

    // Get Started button in nav
    await expect(landingPage.navGetStartedButton).toBeVisible();
  });

  test("nav login button opens auth form", async ({ landingPage }) => {
    await landingPage.clickNavLogin();
    await landingPage.expectLoginSection();
  });

  test("nav get started button opens auth form", async ({ landingPage }) => {
    await landingPage.clickNavGetStarted();
    await landingPage.expectLoginSection();
  });
});

test.describe("Landing Page - Hero Section", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays hero content", async ({ landingPage, page }) => {
    // Headline
    await expect(landingPage.heroHeadline).toBeVisible();
    await expect(landingPage.heroHeadline).toContainText(/revolutionize your workflow/i);

    // Subheadline
    await expect(page.getByText(/experience the future of project management/i)).toBeVisible();

    // CTA buttons
    await expect(landingPage.heroGetStartedButton).toBeVisible();
    await expect(landingPage.watchDemoButton).toBeVisible();
  });

  test("hero get started button opens auth form", async ({ landingPage }) => {
    await landingPage.clickGetStarted();
    await landingPage.expectLoginSection();
  });

  test("can return to landing from login section", async ({ landingPage }) => {
    await landingPage.clickGetStarted();
    await landingPage.expectLoginSection();
    await landingPage.goBackToHome();
    await landingPage.expectLandingPage();
  });
});

test.describe("Landing Page - Features Section", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays features section", async ({ page }) => {
    // Section heading
    await expect(
      page.getByRole("heading", { name: /stop juggling tools.*start shipping/i }),
    ).toBeVisible();

    // Feature cards (3)
    await expect(
      page.getByRole("heading", { name: /docs and issues.*finally together/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /edit together.*real-time/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /see everything.*miss nothing/i })).toBeVisible();

    // Learn more links
    const learnMoreLinks = page.getByRole("link", { name: /learn more/i });
    await expect(learnMoreLinks).toHaveCount(3);
  });
});

test.describe("Landing Page - Stats Section", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays stats section", async ({ page }) => {
    // Section heading
    await expect(page.getByRole("heading", { name: /teams actually like using it/i })).toBeVisible();

    // Stats
    await expect(page.getByText(/less time in meetings/i)).toBeVisible();
    await expect(page.getByText(/fewer tools to manage/i)).toBeVisible();
    await expect(page.getByText(/actually use it daily/i)).toBeVisible();
    await expect(page.getByText(/would recommend/i)).toBeVisible();
  });
});

test.describe("Landing Page - Footer", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test("displays footer sections", async ({ page }) => {
    // Product section
    await expect(page.locator("footer").getByRole("heading", { name: /product/i })).toBeVisible();

    // Company section
    await expect(page.locator("footer").getByRole("heading", { name: /company/i })).toBeVisible();

    // Resources section
    await expect(page.locator("footer").getByRole("heading", { name: /resources/i })).toBeVisible();

    // Legal links
    await expect(page.locator("footer").getByRole("link", { name: /privacy/i })).toBeVisible();
    await expect(page.locator("footer").getByRole("link", { name: /terms/i })).toBeVisible();

    // Copyright
    await expect(page.getByText(/© 2025 nixelo/i)).toBeVisible();
  });
});
