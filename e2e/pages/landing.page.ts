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
  readonly backToHomeButton: Locator;
  readonly loginSectionHeading: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation
    this.navLogo = page.locator("nav").getByText("nixelo");
    this.navLoginButton = page.locator("nav button", { hasText: /^login$/i });
    this.navGetStartedButton = page.locator("nav button", {
      hasText: /get started/i,
    });

    // Hero Section
    this.heroHeadline = page.getByRole("heading", {
      name: /revolutionize your workflow/i,
    });
    this.heroGetStartedButton = page.getByRole("button", {
      name: /get started free/i,
    });
    this.watchDemoButton = page.getByRole("button", { name: /watch demo/i });

    // Login Section (shown after clicking Get Started/Login)
    this.backToHomeButton = page.getByRole("button", {
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
    await this.heroGetStartedButton.click();
    await expect(this.loginSectionHeading).toBeVisible();
  }

  async clickNavLogin() {
    await this.navLoginButton.click();
    await expect(this.loginSectionHeading).toBeVisible();
  }

  async clickNavGetStarted() {
    await this.navGetStartedButton.click();
    await expect(this.loginSectionHeading).toBeVisible();
  }

  async goBackToHome() {
    await this.backToHomeButton.click();
    await expect(this.heroHeadline).toBeVisible();
  }

  // ===================
  // Assertions
  // ===================

  async expectLandingPage() {
    await expect(this.heroHeadline).toBeVisible();
    await expect(this.heroGetStartedButton).toBeVisible();
    await expect(this.navGetStartedButton).toBeVisible();
  }

  async expectLoginSection() {
    await expect(this.loginSectionHeading).toBeVisible();
    await expect(this.backToHomeButton).toBeVisible();
  }
}
