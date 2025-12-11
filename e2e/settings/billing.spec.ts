import { SETTINGS_PROFILES, TEST_COMPANY_SLUG } from "../config";
import { authenticatedTest, expect } from "../fixtures";
import { testUserService } from "../utils";

/**
 * Billing Settings Tests
 *
 * Tests behavior when billing is enabled vs disabled.
 * Uses settings profiles to toggle billingEnabled.
 */
authenticatedTest.describe("Billing Settings", () => {
  // Reset to default settings after each test
  authenticatedTest.afterEach(async () => {
    await testUserService.updateCompanySettings(TEST_COMPANY_SLUG, SETTINGS_PROFILES.default);
  });

  authenticatedTest(
    "billing enabled shows billable checkbox on time entries",
    async ({ dashboardPage, companySlug }) => {
      // Ensure billing is enabled
      const result = await testUserService.updateCompanySettings(companySlug, {
        billingEnabled: true,
      });
      expect(result.success).toBe(true);

      // Navigate to time tracking
      await dashboardPage.goto(companySlug);

      // TODO: Navigate to time entry form and verify billable checkbox is visible
      // This is a placeholder - implement actual UI checks when time entry form exists
    },
  );

  authenticatedTest(
    "billing disabled hides billable checkbox on time entries",
    async ({ dashboardPage, companySlug }) => {
      // Disable billing
      const result = await testUserService.updateCompanySettings(companySlug, {
        billingEnabled: false,
      });
      expect(result.success).toBe(true);

      // Navigate to time tracking
      await dashboardPage.goto(companySlug);

      // TODO: Navigate to time entry form and verify billable checkbox is NOT visible
      // This is a placeholder - implement actual UI checks when time entry form exists
    },
  );
});
