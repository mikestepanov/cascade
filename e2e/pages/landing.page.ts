import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Landing Page Object
 * Handles the NixeloLanding marketing page shown to unauthenticated users
 */
export class LandingPage extends BasePage {
  // ===================
  // Locators - Navigation
  // ===================
  readonly navLogo: Locator;
  readonly navLoginButton: Locator;
  readonly navGetStartedButton: Locator;

  // ===================
  // Locators - Hero Section
  // ===================
  readonly heroHeadline: Locator;
  readonly heroGetStartedButton: Locator;
  readonly watchDemoButton: Locator;

  // ===================
  // Locators - Login Section (when visible)
  // ===================
  readonly backToHomeLink: Locator;
  readonly loginSectionHeading: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation
    this.navLogo = page.locator("nav").getByText("nixelo");
    this.navLoginButton = page.locator("nav").getByText("Sign in");
    this.navGetStartedButton = page.locator("nav").getByRole("link", {
      name: /get started/i,
    });

    // Hero Section
    this.heroHeadline = page.getByRole("heading", {
      name: /revolutionize your workflow/i,
    });
    this.heroGetStartedButton = page.getByRole("link", {
      name: /get started free/i,
    });
    this.watchDemoButton = page.getByRole("link", { name: /watch demo/i });

    // Login Section (shown after clicking Get Started/Login)
    this.backToHomeLink = page.getByRole("link", {
      name: /back to home/i,
    });
    this.loginSectionHeading = page.getByRole("heading", {
      name: /welcome back/i,
    });
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    await this.page.goto("/");
    await this.waitForLoad();
  }

  // ===================
  // Actions
  // ===================

  async clickGetStarted() {
    // Wait for button to be ready
    await this.heroGetStartedButton.waitFor({ state: "visible", timeout: 10000 });

    // Short wait for React hydration (don't use networkidle - Convex WebSockets keep it active)
    await this.page.waitForTimeout(500);

    // Click the button to navigate to signin page
    await this.heroGetStartedButton.click();

    // Wait for signin page to load (URL changes to /signin)
    await this.page.waitForURL("**/signin", { timeout: 10000 });

    // Wait for login section to appear and stabilize
    await this.loginSectionHeading.waitFor({ state: "visible", timeout: 10000 });
    await this.page.waitForTimeout(300); // Let React finish rendering
  }

  async clickNavLogin() {
    await this.navLoginButton.waitFor({ state: "visible", timeout: 10000 });
    await this.navLoginButton.click();
    // Wait for signin page to load
    await this.page.waitForURL("**/signin", { timeout: 10000 });
    await this.loginSectionHeading.waitFor({ state: "visible", timeout: 10000 });
    await this.page.waitForTimeout(300);
  }

  async clickNavGetStarted() {
    await this.navGetStartedButton.waitFor({ state: "visible", timeout: 10000 });
    await this.navGetStartedButton.click();
    // Wait for signin page to load
    await this.page.waitForURL("**/signin", { timeout: 10000 });
    await this.loginSectionHeading.waitFor({ state: "visible", timeout: 10000 });
    await this.page.waitForTimeout(300);
  }

  async goBackToHome() {
    await this.backToHomeLink.waitFor({ state: "visible", timeout: 10000 });
    await this.backToHomeLink.click();
    await this.heroHeadline.waitFor({ state: "visible", timeout: 10000 });
  }

  // ===================
  // Assertions
  // ===================

  async expectLandingPage() {
    await expect(this.heroHeadline).toBeVisible({ timeout: 10000 });
    await expect(this.heroGetStartedButton).toBeVisible({ timeout: 5000 });
    await expect(this.navGetStartedButton).toBeVisible({ timeout: 5000 });
  }

  async expectLoginSection() {
    await expect(this.loginSectionHeading).toBeVisible({ timeout: 10000 });
    await expect(this.backToHomeLink).toBeVisible({ timeout: 10000 });
  }
}
