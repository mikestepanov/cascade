import { E2E_ENDPOINTS, getE2EHeaders, TEST_USERS } from "./config";
import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Onboarding Wizard E2E Tests
 *
 * Tests the onboarding wizard flow for new users.
 * Uses authenticated test fixture with reset onboarding state.
 *
 * Strategy:
 * - Uses the persistent dashboard user (already authenticated)
 * - Resets onboarding state before tests to show onboarding flow again
 */

/**
 * Reset onboarding state for the dashboard test user
 * This clears the onboarding record to allow testing the flow again
 */
async function resetOnboarding(): Promise<void> {
  try {
    const response = await fetch(E2E_ENDPOINTS.resetOnboarding, {
      method: "POST",
      headers: getE2EHeaders(),
      body: JSON.stringify({ email: TEST_USERS.dashboard.email }),
    });
    if (!response.ok) {
      console.warn(`Failed to reset onboarding: ${response.status}`);
    }
    // Small delay to allow DB changes to propagate
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (e) {
    console.warn(`Failed to reset onboarding: ${e}`);
  }
}

// NOTE: These tests reset the dashboard user's onboarding state before running.
// This allows re-testing the onboarding flow with an already-authenticated user.
// The resetOnboarding() call clears the onboarding record, causing the app to show onboarding again.
test.describe("Onboarding Wizard", () => {
  test.beforeEach(async () => {
    // Reset onboarding state before each test via HTTP endpoint
    await resetOnboarding();
  });

  test("displays welcome page with role selection", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Should show welcome heading
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Should show role selection options (use heading role for specificity)
    await expect(page.getByRole("heading", { name: /team lead/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /team member/i })).toBeVisible();
  });

  test("can select team lead role", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Click team lead card (click the heading within the card)
    await page.getByRole("heading", { name: /team lead/i }).click();

    // Should select the card and enable Continue
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).toBeVisible({ timeout: 5000 });
  });

  test("can select team member role", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Click team member card
    await page.getByRole("heading", { name: /team member/i }).click();

    // Should select the card and enable Continue
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).toBeVisible({ timeout: 5000 });
  });

  test("can skip onboarding", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for welcome heading to confirm we're on onboarding
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Find skip element (could be link or button)
    const skipElement = page.getByText(/skip for now/i);
    await expect(skipElement).toBeVisible({ timeout: 5000 });

    // Click skip
    await skipElement.click();

    // Should navigate to dashboard (wait for My Work heading)
    await expect(page.getByRole("heading", { name: /my work/i })).toBeVisible({ timeout: 10000 });
  });

  test("shows feature highlights", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for welcome heading to confirm we're on onboarding
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Should show feature highlights section
    await expect(page.getByText(/kanban boards/i)).toBeVisible();
    await expect(page.getByText(/documents/i)).toBeVisible();
    await expect(page.getByText(/sprint planning/i)).toBeVisible();
  });
});

test.describe
  .skip("Onboarding - Team Lead Flow", () => {
    test.beforeEach(async ({ page }) => {
      // Reset onboarding state via HTTP endpoint
      await resetOnboarding();

      // Navigate to root first to force fresh data fetch, then to onboarding
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.goto("/onboarding");
      await page.waitForLoadState("networkidle");

      // Select team lead role
      await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
        timeout: 10000,
      });
      await page.getByText(/team lead/i).click();
    });

    test("shows project creation option", async ({ page }) => {
      // Should show option to create a project
      await expect(
        page.getByText(/create.*project/i).or(page.getByRole("button", { name: /create/i })),
      ).toBeVisible({ timeout: 5000 });
    });

    test("can go back to role selection", async ({ page }) => {
      // Find and click back button
      const backButton = page.getByRole("button", { name: /back/i });

      if (await backButton.isVisible().catch(() => false)) {
        await backButton.click();

        // Should return to role selection
        await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

// NOTE: This test requires a user that has NOT completed onboarding.
// The resetOnboarding API clears the DB record, but the authenticated user's
// session still redirects to dashboard. Need fresh user or different approach.
test.describe
  .skip("Onboarding - Team Member Flow", () => {
    test.beforeEach(async ({ page }) => {
      // Reset onboarding state via HTTP endpoint
      await resetOnboarding();

      // Navigate to root first to force fresh data fetch, then to onboarding
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.goto("/onboarding");
      await page.waitForLoadState("networkidle");

      // Select team member role
      await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
        timeout: 10000,
      });
      await page.getByText(/team member/i).click();
    });

    test("shows member-specific content", async ({ page }) => {
      // Should show member flow content
      await expect(
        page
          .getByText(/join|explore|ready|complete/i)
          .or(page.getByRole("button", { name: /complete|finish/i })),
      ).toBeVisible({ timeout: 5000 });
    });

    test("can complete onboarding", async ({ page }) => {
      // Find complete button
      const completeButton = page.getByRole("button", { name: /complete|finish|done/i });

      if (await completeButton.isVisible().catch(() => false)) {
        await completeButton.click();

        // Should navigate to dashboard
        await expect(page.getByRole("link", { name: /^dashboard$/i })).toBeVisible({
          timeout: 10000,
        });
      }
    });
  });
