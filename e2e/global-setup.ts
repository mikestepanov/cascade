import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type FullConfig } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, ".auth");
const AUTH_STATE_PATH = path.join(AUTH_DIR, "user.json");

// Convex site URL for E2E OTP retrieval
const CONVEX_SITE_URL = "https://majestic-goshawk-53.convex.site";

// Generate unique test email for each run
const timestamp = Date.now();
// Test user credentials - use a real email that triggers E2E test mode
const TEST_USER = {
  email: `e2e-test-${timestamp}@inbox.mailtrap.io`,
  password: "TestPassword123!",
};

/**
 * Wait for and retrieve OTP from Convex E2E endpoint
 * Polls the endpoint until OTP is available or timeout
 */
async function waitForOTPFromConvex(
  email: string,
  options: { timeout: number; pollInterval: number } = { timeout: 30000, pollInterval: 2000 },
): Promise<string> {
  const endpoint = `${CONVEX_SITE_URL}/e2e/otp?email=${encodeURIComponent(email)}`;
  const startTime = Date.now();

  while (Date.now() - startTime < options.timeout) {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok && data.otp) {
        return data.otp;
      }

      // If not found yet, wait and retry
      if (response.status === 404) {
        await new Promise((resolve) => setTimeout(resolve, options.pollInterval));
        continue;
      }

      // Other errors
      if (!response.ok) {
        console.warn(`OTP endpoint returned ${response.status}: ${data.error}`);
      }
    } catch (e) {
      console.warn(`Failed to fetch OTP: ${e}`);
    }

    await new Promise((resolve) => setTimeout(resolve, options.pollInterval));
  }

  throw new Error(`Timeout waiting for OTP for ${email}`);
}

/**
 * Global setup - runs once before all tests
 * Automatically creates auth state by signing up a test user
 *
 * Uses Convex E2E OTP endpoint for test emails (@inbox.mailtrap.io)
 * which bypasses actual email sending.
 *
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL || "http://localhost:5555";

  // Ensure .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Create fresh auth state by signing up a new test user
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log(`📍 Navigating to ${baseURL}`);
    await page.goto(baseURL);

    // Wait for page to load
    await page.waitForLoadState("load");

    // Wait for the landing page to be interactive by checking for the Get Started link
    // This is more reliable than checking React internals
    const getStartedLink = page.getByRole("link", { name: /get started free/i });
    await getStartedLink.waitFor({ state: "visible", timeout: 30000 });

    // Short wait for React hydration to complete
    await page.waitForTimeout(500);

    // Click "Get Started Free" link to navigate to sign in page
    await getStartedLink.click();

    // Wait for login form to appear
    await page
      .getByRole("heading", { name: /welcome back/i })
      .waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(300);

    // Switch to sign up mode
    const toggleButton = page.getByRole("button", { name: /sign up instead/i });
    await toggleButton.waitFor({ state: "visible", timeout: 10000 });
    // Short wait for React to be ready (don't use networkidle - Convex WebSockets keep it active)
    await page.waitForTimeout(500);
    await toggleButton.evaluate((el: HTMLElement) => el.click());

    // Wait for sign up form - button text changes to "Sign up"
    const submitButton = page.getByRole("button", { name: /^sign up$/i });
    await submitButton.waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(300);

    // Fill in the sign up form - use locators that wait automatically
    const emailInput = page.getByPlaceholder("Email");
    const passwordInput = page.getByPlaceholder("Password");

    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await emailInput.fill(TEST_USER.email);

    await passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await passwordInput.fill(TEST_USER.password);

    // Submit sign up
    console.log(`📤 Submitting sign up form for ${TEST_USER.email}...`);
    await submitButton.click();

    // Wait for either verification page or direct auth
    await page.waitForTimeout(3000);

    // Save screenshot to see what happened
    await page.screenshot({ path: path.join(AUTH_DIR, "after-signup.png") });
    console.log("📸 Screenshot saved to .auth/after-signup.png");

    // Check if email verification is required
    const verificationHeading = page.getByRole("heading", { name: /verify your email/i });
    const verificationVisible = await verificationHeading.isVisible().catch(() => false);

    if (verificationVisible) {
      console.log("📧 Email verification required...");
      console.log(`📬 Fetching OTP from Convex E2E endpoint for ${TEST_USER.email}...`);

      // Get OTP from Convex E2E endpoint (stored by OTPVerification for test emails)
      const otp = await waitForOTPFromConvex(TEST_USER.email, {
        timeout: 30000, // 30 seconds to wait for OTP
        pollInterval: 2000, // Poll every 2 seconds
      });
      console.log(`✓ Retrieved OTP code: ${otp}`);

      // Fill the 8-digit code input
      const codeInput = page.getByPlaceholder("8-digit code");
      await codeInput.waitFor({ state: "visible", timeout: 5000 });
      await codeInput.fill(otp);

      // Click verify button
      const verifyButton = page.getByRole("button", { name: /verify email/i });
      await verifyButton.click();

      // Wait for verification to complete
      await page.waitForTimeout(3000);
      console.log("✓ Verification code submitted");
    }

    // Check if we got to a logged-in state (onboarding or dashboard)
    const onOnboarding = await page
      .getByRole("heading", { name: /welcome to nixelo/i })
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (onOnboarding) {
      console.log("📋 On onboarding page - completing onboarding...");

      // Click "Skip for now" to complete onboarding
      const skipButton = page.getByRole("button", { name: /skip for now/i });
      await skipButton.waitFor({ state: "visible", timeout: 5000 });
      await skipButton.click();

      // Wait for dashboard to load
      await page.waitForTimeout(2000);
      console.log("✓ Onboarding completed");
    }

    // Verify we're on dashboard - look for navigation tabs or "My Work" heading
    const onDashboard = await page
      .getByRole("link", { name: /^dashboard$/i })
      .or(page.getByRole("heading", { name: /my work/i }))
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (!onDashboard) {
      // Check if we're still on landing page (sign up failed)
      const stillOnLanding = await page
        .getByRole("heading", { name: /revolutionize your workflow/i })
        .isVisible()
        .catch(() => false);

      if (stillOnLanding) {
        console.warn("⚠️  Sign up may have failed - still on landing page");
        console.warn("    Dashboard tests will be skipped");
      } else {
        console.log("⚠️  Not on dashboard - checking current state...");
        await page.screenshot({ path: path.join(AUTH_DIR, "auth-state.png") });
      }
    } else {
      console.log("✓ On dashboard - auth state is valid");
    }

    // Save the storage state regardless - tests will skip if auth is invalid
    await context.storageState({ path: AUTH_STATE_PATH });
    console.log("✓ Auth state saved to", AUTH_STATE_PATH);
  } catch (error) {
    console.error("⚠️  Failed to create auth state:", error);
    console.warn("    Dashboard tests will be skipped");

    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: path.join(AUTH_DIR, "global-setup-error.png") });
      console.log("📸 Error screenshot saved to .auth/global-setup-error.png");
    } catch {
      // Ignore screenshot errors
    }

    // Don't save invalid auth state - let tests skip properly
    // by detecting missing file
  } finally {
    await browser.close();
  }
}

export default globalSetup;
