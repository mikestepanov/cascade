import { authenticatedTest, expect } from "./fixtures";

/**
 * Test that mailtrap account (@inbox.mailtrap.io) shows Dev Tools tab
 * Uses authenticated dashboard user fixture with company slug
 */
authenticatedTest(
  "Mailtrap account shows Dev Tools tab in Settings",
  async ({ page, companySlug }) => {
    authenticatedTest.setTimeout(60000);

    console.log(`Using company slug: ${companySlug}`);

    // Navigate to settings with company slug
    await page.goto(`/${companySlug}/settings/profile`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    console.log("On settings page:", page.url());

    // Verify Dev Tools tab is visible (for @inbox.mailtrap.io accounts)
    const devToolsTab = page.getByRole("tab", { name: /dev tools/i });
    await expect(devToolsTab).toBeVisible({ timeout: 10000 });

    console.log("✓ Dev Tools tab is visible for mailtrap account!");
    console.log("\n✅ TEST PASSED: @inbox.mailtrap.io account shows Dev Tools tab");
  },
);
