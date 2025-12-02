import { test as base, expect } from "@playwright/test";
import { OnboardingPage } from "./pages";

/**
 * WelcomeTour E2E Tests
 *
 * Tests the onboarding welcome tour behavior using driver.js.
 * These tests verify the actual tour behavior that cannot be unit tested
 * due to vi.mock() limitations with dynamic imports.
 *
 * Requires: Running backend with a fresh/new user account
 */

// Create test fixture with onboarding page
const test = base.extend<{ onboardingPage: OnboardingPage }>({
  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },
});

test.describe("Welcome Tour - Display", () => {
  test.skip(
    true,
    "Requires fresh user account with tourShown=false - run manually with proper setup",
  );

  test("should display welcome tour for new users", async ({ onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Verify first step is the welcome message
    await onboardingPage.expectWelcomeStep();
  });

  test("should show tour overlay", async ({ onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    await expect(onboardingPage.tourOverlay).toBeVisible();
    await expect(onboardingPage.tourPopover).toBeVisible();
  });
});

test.describe("Welcome Tour - Navigation", () => {
  test.skip(
    true,
    "Requires fresh user account with tourShown=false - run manually with proper setup",
  );

  test("should navigate through tour steps with Next button", async ({ onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Step 1: Welcome
    await onboardingPage.expectWelcomeStep();

    // Step 2: Command Palette
    await onboardingPage.clickNext();
    await onboardingPage.expectCommandPaletteStep();

    // Step 3: Create Project
    await onboardingPage.clickNext();
    await onboardingPage.expectCreateProjectStep();
  });

  test("should navigate back with Previous button", async ({ onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Go to step 2
    await onboardingPage.clickNext();
    await onboardingPage.expectCommandPaletteStep();

    // Go back to step 1
    await onboardingPage.clickPrevious();
    await onboardingPage.expectWelcomeStep();
  });

  test("should show progress indicator", async ({ onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Progress should be visible
    await expect(onboardingPage.tourProgress).toBeVisible();
  });
});

test.describe("Welcome Tour - Completion", () => {
  test.skip(
    true,
    "Requires fresh user account with tourShown=false - run manually with proper setup",
  );

  test("should complete tour when clicking through all steps", async ({ onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Navigate to final step
    await onboardingPage.completeTour();

    // Tour should close after completion
    await onboardingPage.expectTourClosed();
  });

  test("should close tour when final step is reached", async ({ onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Click through all steps
    let stepCount = 0;
    const maxSteps = 10; // Safety limit

    while (stepCount < maxSteps) {
      try {
        await expect(onboardingPage.tourNextButton).toBeVisible({ timeout: 1000 });
        await onboardingPage.clickNext();
        stepCount++;
        await onboardingPage.page.waitForTimeout(300);
      } catch {
        break;
      }
    }

    // Tour should be closed after completion
    await onboardingPage.expectTourClosed();
  });
});

test.describe("Welcome Tour - Skip", () => {
  test.skip(
    true,
    "Requires fresh user account with tourShown=false - run manually with proper setup",
  );

  test("should close tour when skip/close button is clicked", async ({ onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Skip the tour
    await onboardingPage.skipTour();

    // Tour should be closed
    await onboardingPage.expectTourClosed();
  });

  test("should be able to skip from any step", async ({ onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Navigate to step 2
    await onboardingPage.clickNext();
    await onboardingPage.expectCommandPaletteStep();

    // Skip from step 2
    await onboardingPage.skipTour();

    // Tour should be closed
    await onboardingPage.expectTourClosed();
  });
});

test.describe("Welcome Tour - State Persistence", () => {
  test.skip(
    true,
    "Requires fresh user account with tourShown=false - run manually with proper setup",
  );

  test("should not show tour again after completion", async ({ onboardingPage, page }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Complete the tour
    await onboardingPage.completeTour();
    await onboardingPage.expectTourClosed();

    // Refresh the page
    await page.reload();

    // Tour should not appear again
    await page.waitForTimeout(2000); // Wait for potential tour to load
    await onboardingPage.expectTourClosed();
  });

  test("should not show tour again after skipping", async ({ onboardingPage, page }) => {
    await onboardingPage.goto();
    await onboardingPage.waitForTourToAppear();

    // Skip the tour
    await onboardingPage.skipTour();
    await onboardingPage.expectTourClosed();

    // Refresh the page
    await page.reload();

    // Tour should not appear again
    await page.waitForTimeout(2000); // Wait for potential tour to load
    await onboardingPage.expectTourClosed();
  });
});
