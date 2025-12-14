import { DEFAULT_TEST_USER, E2E_ENDPOINTS, getE2EHeaders } from "./config";
import { expect, authenticatedTest as test } from "./fixtures";
import { OnboardingPage } from "./pages";

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
      body: JSON.stringify({ email: DEFAULT_TEST_USER.email }),
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
//
// Uses serial mode to prevent auth token rotation issues between tests.
// Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
// Test 2 loading stale tokens from file will fail.
test.describe("Onboarding Wizard", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });
  test.use({ skipAuthSave: true });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    // Re-authenticate if needed (e.g., after signout test invalidated tokens)
    await ensureAuthenticated();
    // Reset onboarding state before each test via HTTP endpoint
    await resetOnboarding();
  });

  test("displays welcome page with role selection", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();
    await page.waitForLoadState("networkidle");

    // Should show role selection
    await onboarding.expectRoleSelection();
  });

  test("can select team lead role", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await onboarding.waitForWizard();

    // Click team lead card
    await onboarding.selectTeamLead();

    // Should select the card and enable Continue
    await expect(onboarding.continueButton).toBeVisible({ timeout: 5000 });
  });

  test("can select team member role", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await onboarding.waitForWizard();

    // Click team member card
    await onboarding.selectTeamMember();

    // Should select the card and enable Continue
    await expect(onboarding.continueButton).toBeVisible({ timeout: 5000 });
  });

  // TODO: Dashboard stuck in loading state after skip - needs investigation
  test.skip("can skip onboarding", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();
    await page.waitForLoadState("networkidle");

    // Wait for welcome heading to confirm we're on onboarding
    await onboarding.waitForWizard();

    // Find and click skip element
    await expect(onboarding.skipText).toBeVisible({ timeout: 5000 });
    await onboarding.skipOnboarding();

    // Wait for navigation to dashboard
    await page.waitForURL(/\/[^/]+\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");

    // Wait for dashboard to finish loading (spinner disappears)
    await expect(page.locator(".animate-spin")).not.toBeVisible({ timeout: 15000 });

    // Should navigate to dashboard
    await onboarding.expectDashboard();
  });

  test("shows feature highlights", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();
    await page.waitForLoadState("networkidle");

    // Wait for welcome heading to confirm we're on onboarding
    await onboarding.waitForWizard();

    // Should show feature highlights section
    await onboarding.expectFeatureHighlights();
  });
});

// Team Lead Flow runs BEFORE Team Member Flow because Team Lead doesn't navigate away
// from onboarding (just goes back to role selection), while Team Member completes
// onboarding and navigates to dashboard which can corrupt auth state.
test.describe("Onboarding - Team Lead Flow", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });
  // Skip auth save for this test - onboarding state changes can affect auth state
  test.use({ skipAuthSave: true });

  // TODO: Storage state becomes invalid after earlier tests - needs investigation
  test.skip("shows team lead features and can go back to role selection", async ({ page }) => {
    const onboarding = new OnboardingPage(page);

    // Reset onboarding state via HTTP endpoint
    await resetOnboarding();

    // Navigate to onboarding
    await onboarding.goto();
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await onboarding.waitForWizard();

    // Wait for Convex real-time updates to settle after the DB mutation
    await page.waitForTimeout(2000);

    // Select Team Lead role
    await onboarding.selectTeamLead();

    // Wait for Continue button to be enabled and click
    await onboarding.clickContinue();

    // Wait for Team Lead flow to load
    await onboarding.expectTeamLeadFeatures();

    // Test back navigation
    await expect(onboarding.backButton).toBeVisible({ timeout: 5000 });
    await onboarding.clickBack();

    // Should return to role selection
    await onboarding.waitForWizard();
  });
});

// Team Member Flow runs LAST because it completes onboarding and navigates to dashboard.
// Uses ensureAuthenticated to re-login if tokens were invalidated by signout test.
test.describe("Onboarding - Team Member Flow", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });
  test.use({ skipAuthSave: true });

  // TODO: Storage state becomes invalid after earlier tests - needs investigation
  test.skip("shows member-specific content and can complete onboarding", async ({ page }) => {
    const onboarding = new OnboardingPage(page);

    // Reset onboarding state via HTTP endpoint
    await resetOnboarding();

    // Navigate to onboarding and wait for initial load
    await onboarding.goto();
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await onboarding.waitForWizard();

    // Wait for Convex real-time updates to settle after the DB mutation
    await page.waitForTimeout(2000);

    // Select Team Member role
    await onboarding.selectTeamMember();

    // Wait for Continue button to be enabled and click
    await onboarding.clickContinue();

    // Wait for Team Member flow to load
    await onboarding.expectTeamMemberComplete();

    // Click "Go to Dashboard" button to complete onboarding
    await onboarding.goToDashboard();

    // Wait for navigation to dashboard
    await page.waitForURL(/\/[^/]+\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");

    // Wait for dashboard to finish loading (spinner disappears)
    await expect(page.locator(".animate-spin")).not.toBeVisible({ timeout: 15000 });

    // Should navigate to dashboard
    await onboarding.expectDashboard();
  });
});
