import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type FullConfig } from "@playwright/test";
import { AUTH_PATHS, TEST_USERS } from "./config";
import { clearInbox, waitForVerificationEmail } from "./utils/mailtrap";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, ".auth");

/**
 * Check if we're on the dashboard
 */
async function isOnDashboard(page: import("@playwright/test").Page): Promise<boolean> {
  const dashboardIndicators = [
    page.getByRole("heading", { name: /my work/i }),
    page.getByText("Your personal dashboard"),
    page.getByText("ASSIGNED TO ME"),
  ];

  for (const indicator of dashboardIndicators) {
    if (await indicator.isVisible().catch(() => false)) {
      return true;
    }
  }
  return false;
}

/**
 * Try to sign in with existing credentials
 * Returns true if sign-in was successful
 */
async function trySignIn(page: import("@playwright/test").Page, baseURL: string): Promise<boolean> {
  try {
    // Go directly to sign in page
    await page.goto(`${baseURL}/signin`);
    await page.waitForLoadState("load");
    await page.waitForTimeout(1000);

    // Check if already logged in (redirected to dashboard)
    if (await isOnDashboard(page)) {
      console.log("✓ Already logged in, on dashboard");
      return true;
    }

    // Wait for sign in form
    await page
      .getByRole("heading", { name: /welcome back/i })
      .waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(300);

    // Fill sign in form
    const emailInput = page.getByPlaceholder("Email");
    const passwordInput = page.getByPlaceholder("Password");

    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await emailInput.fill(TEST_USERS.dashboard.email);

    await passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await passwordInput.fill(TEST_USERS.dashboard.password);

    console.log(`🔐 Trying to sign in as ${TEST_USERS.dashboard.email}...`);
    const signInButton = page.getByRole("button", { name: /^sign in$/i });
    await signInButton.click();

    await page.waitForTimeout(3000);

    // Check if we made it to dashboard
    if (await isOnDashboard(page)) {
      console.log("✓ Sign-in successful, on dashboard");
      return true;
    }

    // Check if we hit onboarding
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

      // Check dashboard again after onboarding
      if (await isOnDashboard(page)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.log(`ℹ️ Sign-in attempt failed: ${error}`);
    return false;
  }
}

/**
 * Sign up a new user with email verification
 * Uses Mailtrap API to get the OTP
 */
async function signUpNewUser(
  page: import("@playwright/test").Page,
  baseURL: string,
): Promise<boolean> {
  try {
    // Go directly to sign up page
    await page.goto(`${baseURL}/signup`);
    await page.waitForLoadState("load");

    // Wait for sign up form
    await page
      .getByRole("heading", { name: /create an account/i })
      .waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(300);

    // Fill sign up form
    const emailInput = page.getByPlaceholder("Email");
    const passwordInput = page.getByPlaceholder("Password");
    const submitButton = page.getByRole("button", { name: /^create account$/i });

    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await emailInput.fill(TEST_USERS.dashboard.email);

    await passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await passwordInput.fill(TEST_USERS.dashboard.password);

    console.log(`📤 Signing up as ${TEST_USERS.dashboard.email}...`);
    await submitButton.click();

    await page.waitForTimeout(3000);

    // Check for email verification
    const verificationHeading = page.getByRole("heading", { name: /verify your email/i });
    const verificationVisible = await verificationHeading.isVisible().catch(() => false);

    if (verificationVisible) {
      console.log("📧 Email verification required...");

      console.log("📬 Waiting for verification email via Mailtrap...");
      const otp = await waitForVerificationEmail(TEST_USERS.dashboard.email, {
        timeout: 60000,
        pollInterval: 3000,
      });
      console.log(`✓ Retrieved OTP: ${otp}`);

      const codeInput = page.getByPlaceholder("8-digit code");
      await codeInput.waitFor({ state: "visible", timeout: 5000 });
      await codeInput.fill(otp);

      const verifyButton = page.getByRole("button", { name: /verify email/i });
      await verifyButton.click();
      await page.waitForTimeout(3000);
      console.log("✓ Email verified");
    }

    // Check if we're on onboarding
    const onOnboarding = await page
      .getByRole("heading", { name: /welcome to nixelo/i })
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (onOnboarding) {
      console.log("📋 Completing onboarding...");
      const skipButton = page.getByRole("button", { name: /skip for now/i });
      await skipButton.waitFor({ state: "visible", timeout: 5000 });
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify we're on dashboard
    await page.waitForTimeout(2000);

    if (await isOnDashboard(page)) {
      console.log("✓ Sign-up complete, on dashboard");
      return true;
    }

    console.warn("⚠️ Not on dashboard after sign-up");
    await page.screenshot({ path: "e2e/.auth/debug-after-signup.png" });
    return false;
  } catch (error) {
    console.error("❌ Sign-up error:", error);
    return false;
  }
}

/**
 * Global setup - runs once before all tests
 *
 * Strategy for dashboard user:
 * 1. Try to sign in with existing credentials
 * 2. If sign-in fails, sign up with email verification via Mailtrap
 * 3. Complete onboarding and save auth state
 *
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL || "http://localhost:5555";

  // Clear Mailtrap inbox before tests to avoid hitting inbox storage limits
  console.log("📧 Clearing Mailtrap inbox...");
  await clearInbox();

  // Ensure .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const authStatePath = path.join(AUTH_DIR, path.basename(AUTH_PATHS.dashboard));

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Try to sign in first (for subsequent runs)
    console.log("🔧 Attempting sign-in with dashboard user...");
    let success = await trySignIn(page, baseURL);

    // Step 2: If sign-in failed, try sign-up with email verification
    if (!success) {
      console.log("ℹ️ Sign-in failed, attempting sign-up with email verification...");
      success = await signUpNewUser(page, baseURL);
    }

    if (success) {
      await context.storageState({ path: authStatePath });
      console.log("✓ Auth state saved to", authStatePath);
    } else {
      console.warn("⚠️ Failed to create auth state");
      console.warn("   Dashboard tests will be skipped");
      await page.screenshot({ path: path.join(AUTH_DIR, "global-setup-error.png") });
      console.log("📸 Error screenshot saved to .auth/global-setup-error.png");
    }
  } catch (error) {
    console.error("⚠️ Global setup error:", error);
    try {
      await page.screenshot({ path: path.join(AUTH_DIR, "global-setup-error.png") });
      console.log("📸 Error screenshot saved to .auth/global-setup-error.png");
    } catch {
      // Ignore screenshot errors
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup;
