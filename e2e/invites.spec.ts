import { generateTestEmail } from "./config";
import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Invites E2E Tests
 *
 * Tests the user invitation flow:
 * 1. Admin sends an invite
 * 2. Invite appears in the list
 * 3. Admin can revoke the invite
 */

test.describe("User Invitations", () => {
  test("admin can send and revoke invites", async ({ settingsPage, page }) => {
    // 1. Navigate to Settings -> Admin (go directly via URL, no nav tab for settings)
    await settingsPage.goto();
    await settingsPage.switchToTab("admin");

    // 2. Send an invite
    const testEmail = generateTestEmail("invite-test");
    await settingsPage.inviteUser(testEmail, "user");

    // 3. Verify success message and invite in list
    await expect(page.getByText(`Invitation sent to ${testEmail}`)).toBeVisible({ timeout: 5000 });

    // Check if the email appears in the table
    await expect(page.getByRole("cell", { name: testEmail })).toBeVisible({ timeout: 5000 });

    // 4. Revoke the invite
    // Handle confirmation dialog BEFORE clicking (needs to be registered first)
    page.on("dialog", (dialog) => dialog.accept());

    // Find the row with our test email and click its Revoke button
    const row = page.getByRole("row").filter({ hasText: testEmail });
    await row.getByRole("button", { name: /revoke/i }).click();

    // 5. Verify revocation - wait for success toast or status change
    await expect(page.getByText(/invitation revoked|revoked successfully/i).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
