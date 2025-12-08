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
// Skip auth save for ALL onboarding tests - the resetOnboarding mutation and navigation
// can trigger token refreshes that corrupt the auth state file.
// Uses ensureAuthenticated to re-login if tokens were invalidated by signout test.
test.describe("Onboarding Wizard", () => {
  test.use({ skipAuthSave: true });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    // Re-authenticate if needed (e.g., after signout test invalidated tokens)
    await ensureAuthenticated();
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

// Team Lead Flow runs BEFORE Team Member Flow because Team Lead doesn't navigate away
// from onboarding (just goes back to role selection), while Team Member completes
// onboarding and navigates to dashboard which can corrupt auth state.
test.describe("Onboarding - Team Lead Flow", () => {
  // Skip auth save for this test - onboarding state changes can affect auth state
  test.use({ skipAuthSave: true });

  test("shows team lead features and can go back to role selection", async ({
    page,
    ensureAuthenticated,
  }) => {
    // Re-authenticate if needed (e.g., after signout test)
    await ensureAuthenticated();
    // Reset onboarding state via HTTP endpoint
    await resetOnboarding();

    // Navigate to onboarding
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Wait for Convex real-time updates to settle after the DB mutation
    await page.waitForTimeout(2000);

    // Select Team Lead role - click the heading within the card
    await page.getByRole("heading", { name: /team lead/i }).click();

    // Wait for Continue button to be enabled (indicates selection was registered)
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).toBeEnabled({ timeout: 5000 });

    // Click Continue and wait for navigation to Team Lead flow
    await continueButton.click();

    // Wait for Team Lead flow to load - "Perfect for Team Leads" heading
    await expect(page.getByRole("heading", { name: /perfect for team leads/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify "Let's set up your workspace" button is present
    await expect(page.getByRole("button", { name: /let's set up your workspace/i })).toBeVisible({
      timeout: 5000,
    });

    // Test back navigation
    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible({ timeout: 5000 });
    await backButton.click();

    // Should return to role selection
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 5000,
    });
  });
});

// Team Member Flow runs LAST because it completes onboarding and navigates to dashboard.
// Uses ensureAuthenticated to re-login if tokens were invalidated by signout test.
test.describe("Onboarding - Team Member Flow", () => {
  test.use({ skipAuthSave: true });

  test("shows member-specific content and can complete onboarding", async ({
    page,
    ensureAuthenticated,
  }) => {
    // Re-authenticate if needed (e.g., after signout test)
    await ensureAuthenticated();
    // Reset onboarding state via HTTP endpoint
    await resetOnboarding();

    // Navigate to onboarding and wait for initial load
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Wait for Convex real-time updates to settle after the DB mutation
    await page.waitForTimeout(2000);

    // Select Team Member role - click the heading within the card
    await page.getByRole("heading", { name: /team member/i }).click();

    // Wait for Continue button to be enabled (indicates selection was registered)
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).toBeEnabled({ timeout: 5000 });

    // Click Continue and wait for navigation to Team Member flow
    await continueButton.click();

    // Wait for Team Member flow to load - "You're All Set!" heading
    await expect(page.getByRole("heading", { name: /you're all set/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify "Go to Dashboard" button is present
    const dashboardButton = page.getByRole("button", { name: /go to dashboard/i });
    await expect(dashboardButton).toBeVisible({ timeout: 5000 });

    // Click "Go to Dashboard" button to complete onboarding
    await dashboardButton.click();

    // Should navigate to dashboard - look for "My Work" heading
    await expect(page.getByRole("heading", { name: /my work/i })).toBeVisible({
      timeout: 10000,
    });
  });
});
