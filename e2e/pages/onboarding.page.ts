import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Onboarding Page Object
 * Handles the welcome tour and onboarding flow interactions
 */
export class OnboardingPage extends BasePage {
  // Driver.js tour elements
  readonly tourOverlay: Locator;
  readonly tourPopover: Locator;
  readonly tourTitle: Locator;
  readonly tourDescription: Locator;
  readonly tourNextButton: Locator;
  readonly tourPrevButton: Locator;
  readonly tourCloseButton: Locator;
  readonly tourProgress: Locator;

  constructor(page: Page) {
    super(page);

    // Driver.js uses these CSS classes
    this.tourOverlay = page.locator(".driver-overlay");
    this.tourPopover = page.locator(".driver-popover");
    this.tourTitle = page.locator(".driver-popover-title");
    this.tourDescription = page.locator(".driver-popover-description");
    this.tourNextButton = page.locator(".driver-popover-next-btn");
    this.tourPrevButton = page.locator(".driver-popover-prev-btn");
    this.tourCloseButton = page.locator(".driver-popover-close-btn");
    this.tourProgress = page.locator(".driver-popover-progress-text");
  }

  async goto(): Promise<void> {
    // Onboarding shows on /onboarding route for new users
    await this.page.goto("/onboarding");
  }

  /**
   * Wait for the tour to appear (driver.js loads dynamically)
   */
  async waitForTourToAppear() {
    await expect(this.tourPopover).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check if tour is currently visible
   */
  async isTourVisible(): Promise<boolean> {
    return this.isVisible(this.tourPopover);
  }

  /**
   * Get the current tour step title
   */
  async getTourTitle(): Promise<string> {
    return (await this.tourTitle.textContent()) ?? "";
  }

  /**
   * Get the current tour step description
   */
  async getTourDescription(): Promise<string> {
    return (await this.tourDescription.textContent()) ?? "";
  }

  /**
   * Click next to advance the tour
   */
  async clickNext() {
    await this.tourNextButton.click();
  }

  /**
   * Click previous to go back in the tour
   */
  async clickPrevious() {
    await this.tourPrevButton.click();
  }

  /**
   * Click close/skip to exit the tour early
   */
  async skipTour() {
    await this.tourCloseButton.click();
  }

  /**
   * Complete the entire tour by clicking through all steps
   */
  async completeTour() {
    await this.waitForTourToAppear();

    // Keep clicking next until we can't anymore
    let hasNext = true;
    while (hasNext) {
      try {
        await expect(this.tourNextButton).toBeVisible({ timeout: 2000 });
        await this.tourNextButton.click();
        // Small delay to let animations complete
        await this.page.waitForTimeout(300);
      } catch {
        hasNext = false;
      }
    }
  }

  /**
   * Assert tour is showing welcome message
   */
  async expectWelcomeStep() {
    await expect(this.tourTitle).toContainText("Welcome to Nixelo");
  }

  /**
   * Assert tour is on command palette step
   */
  async expectCommandPaletteStep() {
    await expect(this.tourTitle).toContainText("Command Palette");
  }

  /**
   * Assert tour is on create project step
   */
  async expectCreateProjectStep() {
    await expect(this.tourTitle).toContainText("Create Your First Project");
  }

  /**
   * Assert tour is on final step
   */
  async expectFinalStep() {
    await expect(this.tourTitle).toContainText("Ready to Get Started");
  }

  /**
   * Assert tour is no longer visible
   */
  async expectTourClosed() {
    await expect(this.tourPopover).not.toBeVisible();
    await expect(this.tourOverlay).not.toBeVisible();
  }
}
