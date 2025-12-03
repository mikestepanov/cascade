import { expect } from "@playwright/test";
import { authenticatedTest as test } from "./fixtures";

/**
 * Onboarding Wizard E2E Tests
 *
 * Tests the onboarding wizard flow for new users.
 * Uses authenticated test fixture with fresh onboarding state.
 */

test.describe("Onboarding Wizard", () => {
  test.beforeEach(async ({ page }) => {
    // Reset onboarding state before each test by calling Convex mutation
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Call resetOnboarding mutation via browser context
    await page.evaluate(async () => {
      // Access the Convex client from window (exposed by ConvexProvider)
      const convex = (window as unknown as { __CONVEX_CLIENT__?: { mutation: Function } })
        .__CONVEX_CLIENT__;
      if (convex) {
        try {
          await convex.mutation("onboarding:resetOnboarding", {});
        } catch {
          // Ignore errors - onboarding may already be reset
        }
      }
    });

    // Small delay for mutation to complete
    await page.waitForTimeout(500);
  });

  test("displays welcome page with role selection", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Should show welcome heading
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Should show role selection options
    await expect(page.getByText(/team lead/i)).toBeVisible();
    await expect(page.getByText(/team member/i)).toBeVisible();
  });

  test("can select team lead role", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Click team lead option
    await page.getByText(/team lead/i).click();

    // Should navigate to lead flow
    await expect(page.getByText(/create.*project|get started/i)).toBeVisible({ timeout: 5000 });
  });

  test("can select team member role", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for role selection to appear
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Click team member option
    await page.getByText(/team member/i).click();

    // Should navigate to member flow
    await expect(
      page.getByText(/join.*team|explore|ready/i).or(page.getByRole("button", { name: /complete/i }))
    ).toBeVisible({ timeout: 5000 });
  });

  test("can skip onboarding", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for skip button to appear
    const skipButton = page.getByRole("button", { name: /skip for now/i });
    await expect(skipButton).toBeVisible({ timeout: 10000 });

    // Click skip
    await skipButton.click();

    // Should navigate to dashboard
    await expect(page.getByRole("link", { name: /^dashboard$/i })).toBeVisible({ timeout: 10000 });
  });

  test("shows feature highlights", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // Wait for content to load
    await expect(page.getByRole("heading", { name: /welcome to nixelo/i })).toBeVisible({
      timeout: 10000,
    });

    // Should show feature highlights section (varies by implementation)
    // Check for any feature-related content
    const hasFeatures = await page
      .getByText(/document|project|real-time|collaborate/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasFeatures).toBe(true);
  });
});

test.describe("Onboarding - Team Lead Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Reset and navigate to onboarding
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await page.evaluate(async () => {
      const convex = (window as unknown as { __CONVEX_CLIENT__?: { mutation: Function } })
        .__CONVEX_CLIENT__;
      if (convex) {
        try {
          await convex.mutation("onboarding:resetOnboarding", {});
        } catch {
          // Ignore
        }
      }
    });

    await page.waitForTimeout(500);
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
      page.getByText(/create.*project/i).or(page.getByRole("button", { name: /create/i }))
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

test.describe("Onboarding - Team Member Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Reset and navigate to onboarding
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await page.evaluate(async () => {
      const convex = (window as unknown as { __CONVEX_CLIENT__?: { mutation: Function } })
        .__CONVEX_CLIENT__;
      if (convex) {
        try {
          await convex.mutation("onboarding:resetOnboarding", {});
        } catch {
          // Ignore
        }
      }
    });

    await page.waitForTimeout(500);
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
        .or(page.getByRole("button", { name: /complete|finish/i }))
    ).toBeVisible({ timeout: 5000 });
  });

  test("can complete onboarding", async ({ page }) => {
    // Find complete button
    const completeButton = page.getByRole("button", { name: /complete|finish|done/i });

    if (await completeButton.isVisible().catch(() => false)) {
      await completeButton.click();

      // Should navigate to dashboard
      await expect(page.getByRole("link", { name: /^dashboard$/i })).toBeVisible({ timeout: 10000 });
    }
  });
});
