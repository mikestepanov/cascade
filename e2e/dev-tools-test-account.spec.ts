import { expect, test } from "@playwright/test";
import { TEST_USERS } from "./config";

const BASE_URL = "http://localhost:5555";

/**
 * Test that mailtrap account (@inbox.mailtrap.io) shows Dev Tools tab
 * Uses existing dashboard user to verify the feature works
 */
test("Mailtrap account shows Dev Tools tab in Settings", async ({ page }) => {
  test.setTimeout(60000); // 1 minute timeout

  const testEmail = TEST_USERS.dashboard.email;
  const testPassword = TEST_USERS.dashboard.password;

  console.log(`Testing Dev Tools visibility for: ${testEmail}`);

  // Navigate to signin page
  await page.goto(`${BASE_URL}/signin`);
  await page.waitForLoadState("load");
  await page.waitForTimeout(1000);

  // Wait for signin form
  const heading = page.getByRole("heading", { name: /welcome back/i });
  await heading.waitFor({ state: "visible", timeout: 15000 });

  console.log("Expanding email form...");

  // Click "Continue with email" to expand form (two-step auth flow)
  const continueButton = page.getByRole("button", { name: /continue with email/i });
  await continueButton.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(500); // Wait for React hydration
  await continueButton.evaluate((btn) => {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, view: window });
    btn.dispatchEvent(event);
  });

  // Wait for form to expand
  const signInButton = page.getByRole("button", { name: "Sign in", exact: true });
  await signInButton.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(400); // Wait for formReady state

  console.log("Filling signin form...");

  // Fill signin form
  await page.getByPlaceholder("Email").fill(testEmail);
  await page.getByPlaceholder("Password").fill(testPassword);
  await signInButton.click();

  console.log("Signin form submitted...");

  // Wait for redirect
  await page.waitForTimeout(5000);

  // Take screenshot of current state
  await page.screenshot({ path: "e2e/.auth/after-signin.png" });
  console.log("Current URL:", page.url());

  // Check if we need to skip onboarding
  const onOnboarding = await page
    .getByRole("heading", { name: /welcome to nixelo/i })
    .isVisible()
    .catch(() => false);

  if (onOnboarding) {
    console.log("📋 On onboarding - completing...");
    const skipButton = page.getByRole("button", { name: /skip for now/i });
    await skipButton.waitFor({ state: "visible", timeout: 5000 });
    await skipButton.click();
    await page.waitForTimeout(2000);
  }

  // Navigate to settings
  await page.goto(`${BASE_URL}/settings/profile`);
  await page.waitForLoadState("load");
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: "e2e/.auth/mailtrap-settings.png" });
  console.log("On settings page:", page.url());

  // Verify Dev Tools tab is visible (for @inbox.mailtrap.io accounts)
  // Tab component uses role="tab", not role="button"
  const devToolsTab = page.getByRole("tab", { name: /dev tools/i });
  await expect(devToolsTab).toBeVisible({ timeout: 10000 });

  console.log("✓ Dev Tools tab is visible for mailtrap account!");

  // Take screenshot showing Dev Tools tab is present
  await page.screenshot({ path: "e2e/.auth/dev-tools-tab-visible.png" });

  // Test passed - the main goal is to verify Dev Tools tab appears for test accounts
  // The tab being visible proves the isTestEmail() check is working correctly
  console.log("\n✅ TEST PASSED: @inbox.mailtrap.io account shows Dev Tools tab");
});
