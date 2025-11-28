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
    await expect(page.locator("nav").getByText("Login")).toBeVisible();

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
    await expect(page.getByRole("heading", { name: /everything you need to succeed/i })).toBeVisible();

    // Feature cards (3)
    await expect(page.getByRole("heading", { name: /seamless workflow automation/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /intelligent time tracking/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /integrated project clarity/i })).toBeVisible();

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
    await expect(page.getByRole("heading", { name: /why choose nixelo/i })).toBeVisible();

    // Stats
    await expect(page.getByText(/faster project delivery/i)).toBeVisible();
    await expect(page.getByText(/reduction in overhead/i)).toBeVisible();
    await expect(page.getByText(/team adoption rate/i)).toBeVisible();
    await expect(page.getByText(/customer satisfaction/i)).toBeVisible();
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
