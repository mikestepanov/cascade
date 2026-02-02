import { expect, test } from "./fixtures";

/**
 * Invite Page E2E Tests
 *
 * Tests the invitation acceptance flow:
 * - Invalid token shows error state
 * - Loading state while fetching invite details
 *
 * Note: Full acceptance flow requires creating invites via API,
 * which would need test-user-service extension. For now, we test
 * the error states and page structure.
 */

test.describe("Invite Page", () => {
  test("shows invalid invitation message for non-existent token", async ({ page }) => {
    // Navigate to invite page with a fake token
    await page.goto("/invite/invalid-token-12345");

    // Wait for loading to complete
    await page.waitForLoadState("domcontentloaded");

    // Should show "Invalid Invitation" heading
    await expect(page.getByRole("heading", { name: /invalid invitation/i })).toBeVisible();

    // Should have an explanation message
    await expect(page.getByText(/this invitation link is invalid|has been removed/i)).toBeVisible();

    // Should have a "Go to Home" button
    await expect(page.getByRole("button", { name: /go to home/i })).toBeVisible();
  });

  test("invalid invite page has Go to Home button that works", async ({ page }) => {
    // Navigate to invite page with a fake token
    await page.goto("/invite/another-fake-token");

    // Wait for the invalid state to show
    await expect(page.getByRole("heading", { name: /invalid invitation/i })).toBeVisible();

    // Click the "Go to Home" button
    const homeButton = page.getByRole("button", { name: /go to home/i });
    await homeButton.click();

    // Should navigate to home page
    await expect(page).toHaveURL(/^\/?$/);
  });

  test("shows loading state initially", async ({ page }) => {
    // Navigate to invite page
    // We use Promise.race to catch the loading state before it resolves to invalid
    await page.goto("/invite/test-loading-state", { waitUntil: "commit" });

    // Either we see loading or it already resolved to invalid (depends on speed)
    // At minimum the page should load without errors
    await page.waitForLoadState("domcontentloaded");

    // Page should show either loading or invalid state
    const hasLoading = await page
      .getByText(/loading invitation/i)
      .isVisible()
      .catch(() => false);
    const hasInvalid = await page
      .getByRole("heading", { name: /invalid invitation/i })
      .isVisible()
      .catch(() => false);

    // One of them should be true
    expect(hasLoading || hasInvalid).toBe(true);
  });

  test("invite page shows Nixelo branding", async ({ page }) => {
    // Navigate to invite page (even invalid tokens show the page layout)
    await page.goto("/invite/branding-test-token");

    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");

    // Should show Nixelo branding in header
    await expect(page.getByText("Nixelo")).toBeVisible();
  });
});
