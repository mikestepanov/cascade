import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Onboarding Page Object
 * Handles both:
 * - The new onboarding wizard (role selection, features)
 * - The legacy Driver.js welcome tour
 */
export class OnboardingPage extends BasePage {
  // ===================
  // Onboarding Wizard Locators
  // ===================
  readonly welcomeHeading: Locator;
  readonly teamLeadCard: Locator;
  readonly teamMemberCard: Locator;
  readonly continueButton: Locator;
  readonly backButton: Locator;
  readonly skipButton: Locator;
  readonly skipText: Locator;

  // Team Lead flow
  readonly teamLeadHeading: Locator;
  readonly setupWorkspaceButton: Locator;

  // Team Member flow
  readonly allSetHeading: Locator;
  readonly goToDashboardButton: Locator;

  // Feature highlights
  readonly kanbanBoardsText: Locator;
  readonly documentsText: Locator;
  readonly sprintPlanningText: Locator;

  // Dashboard (after onboarding)
  readonly myWorkHeading: Locator;

  // ===================
  // Driver.js Tour Locators (legacy)
  // ===================
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

    // Onboarding wizard
    this.welcomeHeading = page.getByRole("heading", { name: /welcome to nixelo/i });
    this.teamLeadCard = page.getByRole("heading", { name: /team lead/i });
    this.teamMemberCard = page.getByRole("heading", { name: /team member/i });
    this.continueButton = page.getByRole("button", { name: /continue/i });
    this.backButton = page.getByRole("button", { name: /back/i });
    this.skipButton = page.getByRole("button", { name: /skip for now/i });
    this.skipText = page.getByText(/skip for now/i);

    // Team Lead flow
    this.teamLeadHeading = page.getByRole("heading", { name: /perfect for team leads/i });
    this.setupWorkspaceButton = page.getByRole("button", { name: /let's set up your workspace/i });

    // Team Member flow
    this.allSetHeading = page.getByRole("heading", { name: /you're all set/i });
    this.goToDashboardButton = page.getByRole("button", { name: /go to dashboard/i });

    // Feature highlights
    this.kanbanBoardsText = page.getByText(/kanban boards/i);
    this.documentsText = page.getByText(/documents/i);
    this.sprintPlanningText = page.getByText(/sprint planning/i);

    // Dashboard
    this.myWorkHeading = page.getByRole("heading", { name: /my work/i });

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

  // ===================
  // Onboarding Wizard Actions
  // ===================

  /**
   * Wait for onboarding wizard to load
   */
  async waitForWizard(timeout = 15000) {
    await expect(this.welcomeHeading).toBeVisible({ timeout });
  }

  /**
   * Select team lead role
   */
  async selectTeamLead() {
    await this.teamLeadCard.click();
  }

  /**
   * Select team member role
   */
  async selectTeamMember() {
    await this.teamMemberCard.click();
  }

  /**
   * Click continue button
   */
  async clickContinue() {
    await expect(this.continueButton).toBeEnabled({ timeout: 5000 });
    await this.continueButton.click();
  }

  /**
   * Click back button
   */
  async clickBack() {
    await this.backButton.click();
  }

  /**
   * Skip onboarding and go to dashboard
   */
  async skipOnboarding() {
    // Try button first, then text
    const skipVisible = await this.skipButton.isVisible().catch(() => false);
    if (skipVisible) {
      await this.skipButton.click();
    } else {
      await this.skipText.click();
    }
  }

  /**
   * Complete team lead flow to workspace setup
   */
  async goToWorkspaceSetup() {
    await this.setupWorkspaceButton.click();
  }

  /**
   * Complete team member flow to dashboard
   */
  async goToDashboard() {
    await this.goToDashboardButton.click();
  }

  // ===================
  // Onboarding Wizard Assertions
  // ===================

  /**
   * Assert wizard shows role selection
   */
  async expectRoleSelection() {
    await expect(this.welcomeHeading).toBeVisible({ timeout: 15000 });
    await expect(this.teamLeadCard).toBeVisible();
    await expect(this.teamMemberCard).toBeVisible();
  }

  /**
   * Assert wizard shows team lead features
   */
  async expectTeamLeadFeatures() {
    await expect(this.teamLeadHeading).toBeVisible({ timeout: 5000 });
    await expect(this.setupWorkspaceButton).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert wizard shows team member completion
   */
  async expectTeamMemberComplete() {
    await expect(this.allSetHeading).toBeVisible({ timeout: 5000 });
    await expect(this.goToDashboardButton).toBeVisible();
  }

  /**
   * Assert feature highlights are visible
   */
  async expectFeatureHighlights() {
    await expect(this.kanbanBoardsText).toBeVisible();
    await expect(this.documentsText).toBeVisible();
    await expect(this.sprintPlanningText).toBeVisible();
  }

  /**
   * Assert we're on the dashboard
   */
  async expectDashboard(timeout = 15000) {
    await expect(this.myWorkHeading).toBeVisible({ timeout });
  }
}
