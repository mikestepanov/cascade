/**
 * Debug script to investigate E2E auth failures
 * Captures console logs, network errors, and page state
 */
import { test } from "@playwright/test";
import { TestUserService } from "./utils/test-user-service";

const TEST_USER = {
  email: "debug-test@inbox.mailtrap.io",
  password: "TestPassword123!",
};

// SKIPPED: Flaky due to reliance on exact text transition timing and manual cleanup
test.skip("debug sign-in flow with full logging", async ({ page, baseURL }) => {
  const userService = new TestUserService();

  // Capture console messages
  const consoleLogs: string[] = [];
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    consoleLogs.push(`[${type}] ${text}`);
    console.log(`  🖥️  Console [${type}]: ${text}`);
  });

  // Capture page errors
  page.on("pageerror", (error) => {
    console.log(`  ❌ Page Error: ${error.message}`);
    consoleLogs.push(`[ERROR] ${error.message}\n${error.stack}`);
  });

  // Capture network failures
  page.on("requestfailed", (request) => {
    console.log(`  🌐 Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Capture network responses
  page.on("response", async (response) => {
    const url = response.url();
    const status = response.status();

    // Log auth-related requests
    if (url.includes("/api/auth") || url.includes("convex") || status >= 400) {
      console.log(`  🌐 Response: ${status} ${url}`);

      // Try to get response body for errors
      if (status >= 400) {
        try {
          const body = await response.text();
          console.log(`  📄 Response body: ${body.slice(0, 200)}`);
        } catch {
          // Body might not be available
        }
      }
    }
  });

  console.log("\n🔧 STEP 1: Delete existing user");
  await userService.deleteTestUser(TEST_USER.email);

  console.log("\n🔧 STEP 2: Create test user via API");
  const createResult = await userService.createTestUser(
    TEST_USER.email,
    TEST_USER.password,
    true, // skipOnboarding
  );
  console.log("  Result:", JSON.stringify(createResult, null, 2));

  console.log("\n🔧 STEP 3: Navigate to sign-in page");
  await page.goto(`${baseURL}/signin`, { waitUntil: "domcontentloaded" });

  // Wait a bit for Convex to initialize
  await page.waitForTimeout(2000);

  console.log("\n🔧 STEP 4: Check page state");
  const pageTitle = await page.title();
  const headingText = await page.locator("h1, h2").first().textContent();
  console.log(`  Title: ${pageTitle}`);
  console.log(`  Heading: ${headingText}`);

  console.log('\n🔧 STEP 5: Look for "Continue with email" button');
  const continueBtn = page.locator('button:has-text("Continue with email")');
  const continueVisible = await continueBtn.isVisible().catch(() => false);
  console.log(`  Continue button visible: ${continueVisible}`);

  if (continueVisible) {
    console.log('\n🔧 STEP 6: Click "Continue with email"');
    await continueBtn.click();
    await page.waitForTimeout(1000);
  }

  console.log("\n🔧 STEP 7: Check if form is visible");
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');

  const emailVisible = await emailInput.isVisible().catch(() => false);
  const passwordVisible = await passwordInput.isVisible().catch(() => false);
  const submitVisible = await submitButton.isVisible().catch(() => false);

  console.log(`  Email input visible: ${emailVisible}`);
  console.log(`  Password input visible: ${passwordVisible}`);
  console.log(`  Submit button visible: ${submitVisible}`);

  if (!(emailVisible && passwordVisible)) {
    console.log("\n❌ PROBLEM: Form not visible after clicking continue!");
    const bodyText = await page.locator("body").textContent();
    console.log(`  Body text: ${bodyText?.slice(0, 300)}`);

    // Take screenshot
    await page.screenshot({ path: "e2e/.auth/debug-form-not-visible.png" });
    return;
  }

  console.log("\n🔧 STEP 8: Fill in credentials");
  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  const emailValue = await emailInput.inputValue();
  const passwordValue = await passwordInput.inputValue();
  console.log(`  Email filled: ${emailValue}`);
  console.log(`  Password filled: ${passwordValue.length} chars`);

  console.log("\n🔧 STEP 9: Click submit and watch what happens");

  // 5. Check if button text changed to "Sign In"
  // The transition can be fast, so we use toPass with localized expectation
  await expect(async () => {
    const buttonText = await submitButton.innerText();
    console.log(`Current button text: ${buttonText}`);

    // If it says "Continue", we might need to "poke" the input or click again
    if (buttonText.toLowerCase().includes("continue")) {
      console.log("  ⚠️ Still on Continue, poking email input and clicking again...");
      await emailInput.focus();
      await page.keyboard.press("End");
      await page.keyboard.press("Space");
      await page.keyboard.press("Backspace");
      await submitButton.click();
      await page.waitForTimeout(2000);
      throw new Error("Still on Continue button");
    }
  }).toPass({ timeout: 15000 });

  await expect(submitButton).toHaveText(/Sign In/i, { timeout: 5000 });
  const newSubmitText = await submitButton.textContent();
  console.log(`  Button text after transition: "${newSubmitText}"`);

  // Now get actual submit button (might be different after state change)
  const actualSubmitButton = page.locator('button[type="submit"]');
  const actualSubmitText = await actualSubmitButton.textContent();
  console.log(`  Final submit button text before clicking: "${actualSubmitText}"`);

  //Start watching for URL changes
  const urlBefore = page.url();
  console.log(`  URL before submit: ${urlBefore}`);

  await actualSubmitButton.click();

  // Wait a moment for button text to change
  await page.waitForTimeout(500);
  const submitTextAfter = await actualSubmitButton.textContent().catch(() => "button gone");
  console.log(`  Submit button text after click: "${submitTextAfter}"`);

  console.log("\n🔧 STEP 10: Wait for redirect (or timeout)");

  try {
    await page.waitForURL(/\/(onboarding|[^/]+\/dashboard)/, {
      timeout: 10000,
      waitUntil: "domcontentloaded",
    });
    const urlAfter = page.url();
    console.log(`  ✅ Redirected to: ${urlAfter}`);
  } catch (error) {
    const urlAfter = page.url();
    console.log(`  ❌ Redirect timeout! Still at: ${urlAfter}`);

    // Check for errors on page
    const errorText = await page
      .locator('[role="alert"], .error, .text-red-500')
      .allTextContents()
      .catch(() => []);

    if (errorText.length > 0) {
      console.log(`  ⚠️  Error messages found: ${errorText.join(", ")}`);
    }

    // Take screenshot
    await page.screenshot({ path: "e2e/.auth/debug-redirect-timeout.png" });

    // Get current page state
    const finalBody = await page.locator("body").textContent();
    console.log(`  📄 Final page content: ${finalBody?.slice(0, 300)}`);
  }

  console.log("\n📊 CONSOLE LOGS CAPTURED:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  consoleLogs.slice(0, 50).forEach((log) => {
    console.log(`  ${log}`);
  });
  if (consoleLogs.length > 50) {
    console.log(`  ... and ${consoleLogs.length - 50} more logs`);
  }
});
