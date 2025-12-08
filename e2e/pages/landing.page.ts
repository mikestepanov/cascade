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
  // Locators - Auth Pages (after navigation)
  // ===================
  readonly signInHeading: Locator;
  readonly signUpHeading: Locator;

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

    // Auth page headings (separate routes now)
    this.signInHeading = page.getByRole("heading", { name: /welcome back/i });
    this.signUpHeading = page.getByRole("heading", { name: /create an account/i });
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

    // Click the button to navigate to signup page
    await this.heroGetStartedButton.click();

    // Wait for signup page to load (URL changes to /signup)
    await this.page.waitForURL("**/signup", { timeout: 10000 });

    // Wait for signup heading to appear and stabilize
    await this.signUpHeading.waitFor({ state: "visible", timeout: 10000 });
    await this.page.waitForTimeout(300); // Let React finish rendering
  }

  async clickNavLogin() {
    await this.navLoginButton.waitFor({ state: "visible", timeout: 10000 });
    await this.navLoginButton.click();
    // Wait for signin page to load
    await this.page.waitForURL("**/signin", { timeout: 10000 });
    await this.signInHeading.waitFor({ state: "visible", timeout: 10000 });
    await this.page.waitForTimeout(300);
  }

  async clickNavGetStarted() {
    await this.navGetStartedButton.waitFor({ state: "visible", timeout: 10000 });
    await this.navGetStartedButton.click();
    // Wait for signup page to load
    await this.page.waitForURL("**/signup", { timeout: 10000 });
    await this.signUpHeading.waitFor({ state: "visible", timeout: 10000 });
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate back to landing page from auth pages using browser back or logo click
   */
  async goBackToHome() {
    // Use browser back navigation
    await this.page.goBack();
    // Wait for landing page to load
    await this.page.waitForURL("**/", { timeout: 10000 });
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

  async expectSignInPage() {
    await expect(this.signInHeading).toBeVisible({ timeout: 10000 });
  }

  async expectSignUpPage() {
    await expect(this.signUpHeading).toBeVisible({ timeout: 10000 });
  }

  /**
   * Alias for expectSignInPage - tests may call it expectLoginSection
   */
  async expectLoginSection() {
    await this.expectSignInPage();
  }

  /**
   * Alias for expectSignUpPage - tests may call it expectSignUpSection
   */
  async expectSignUpSection() {
    await this.expectSignUpPage();
  }
}
