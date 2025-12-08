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
 * Click the "Continue with email" button and wait for form to expand
 * Uses multiple strategies to handle React hydration timing
 */
async function clickContinueWithEmail(page: import("@playwright/test").Page): Promise<boolean> {
  const continueButton = page.getByRole("button", { name: /continue with email/i });
  // Check for form expansion by looking for the submit button
  const submitButton = page.getByRole("button", { name: /^(sign in|create account)$/i });

  // Check if form is already expanded
  if (await submitButton.isVisible().catch(() => false)) {
    return true;
  }

  // Wait for button to be ready and React to hydrate
  await continueButton.waitFor({ state: "visible", timeout: 5000 });

  // Give React time to attach event handlers after hydration
  await page.waitForTimeout(500);

  // Try clicking with multiple strategies
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`📍 Click attempt ${attempt}...`);

    try {
      // Use evaluate to trigger a proper click that React will handle
      await continueButton.evaluate((btn) => {
        // Simulate a proper mouse click event
        const event = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        btn.dispatchEvent(event);
      });

      // Wait for form to expand
      await submitButton.waitFor({ state: "visible", timeout: 3000 });
      console.log("✓ Form expanded successfully");
      return true;
    } catch {
      if (attempt < 3) {
        console.log(`⚠️ Attempt ${attempt} failed, waiting before retry...`);
        await page.waitForTimeout(500);
      }
    }
  }

  // Final fallback: try Playwright's native click
  console.log("⚠️ MouseEvent approach failed, trying Playwright click...");
  try {
    await continueButton.click({ timeout: 5000 });
    await submitButton.waitFor({ state: "visible", timeout: 3000 });
    return true;
  } catch {
    console.log("⚠️ Form still not expanded after all attempts");
    return false;
  }
}

/**
 * Try to sign in with existing credentials
 * Returns true if sign-in was successful
 */
async function trySignIn(page: import("@playwright/test").Page, baseURL: string): Promise<boolean> {
  try {
    // Go to sign in page and wait for Convex to hydrate
    // Use domcontentloaded - networkidle never resolves due to Convex WebSockets
    await page.goto(`${baseURL}/signin`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000); // Allow React to hydrate

    // Check if already logged in (redirected to dashboard)
    if (await isOnDashboard(page)) {
      console.log("✓ Already logged in, on dashboard");
      return true;
    }

    // Wait for sign in form to be visible (indicates hydration complete)
    await page
      .getByRole("heading", { name: /welcome back/i })
      .waitFor({ state: "visible", timeout: 10000 });

    // Click "Continue with email" to reveal form fields
    const formExpanded = await clickContinueWithEmail(page);
    if (!formExpanded) {
      console.log("⚠️ Could not expand sign-in form");
      return false;
    }

    // Fill form fields
    const emailInput = page.getByPlaceholder("Email");
    const passwordInput = page.getByPlaceholder("Password");

    await emailInput.fill(TEST_USERS.dashboard.email);
    await passwordInput.fill(TEST_USERS.dashboard.password);

    console.log(`🔐 Trying to sign in as ${TEST_USERS.dashboard.email}...`);

    // Wait for form to be ready (350ms delay in React component)
    await page.waitForTimeout(400);

    // After clicking "Continue with email", the button text changes to "Sign in"
    const signInButton = page.getByRole("button", { name: "Sign in", exact: true });
    await signInButton.waitFor({ state: "visible", timeout: 5000 });
    await signInButton.click();

    // Wait for navigation - either dashboard or onboarding
    // Use domcontentloaded because Convex WebSockets keep network busy
    try {
      await page.waitForURL(/\/(dashboard|onboarding)/, {
        timeout: 15000,
        waitUntil: "domcontentloaded",
      });
    } catch {
      // URL wait may timeout due to Convex, but check if we're already there
      console.log("⚠️ URL wait timed out, checking current location...");
    }

    // Check current URL regardless of timeout
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Check if we made it to dashboard
    if (await isOnDashboard(page)) {
      console.log("✓ Sign-in successful, on dashboard");
      return true;
    }

    // Check if we hit onboarding
    if (currentUrl.includes("/onboarding")) {
      console.log("📋 On onboarding - completing...");
      const skipButton = page.getByRole("button", { name: /skip for now/i });
      await skipButton.waitFor({ state: "visible", timeout: 5000 });
      await skipButton.click();

      // Wait for redirect to dashboard
      try {
        await page.waitForURL(/\/dashboard/, { timeout: 10000, waitUntil: "domcontentloaded" });
      } catch {
        // May timeout but check if we're there
      }

      if (await isOnDashboard(page)) {
        console.log("✓ Onboarding complete, on dashboard");
        return true;
      }
    }

    return false;
  } catch (error) {
    console.log(`ℹ️ Sign-in attempt failed: ${error}`);
    // Even if we caught an error, check if we're already authenticated
    const currentUrl = page.url();
    if (currentUrl.includes("/onboarding") || currentUrl.includes("/dashboard")) {
      console.log("📍 Despite error, we're at auth-protected page. Attempting to complete...");
      return await handleOnboardingOrDashboard(page);
    }
    return false;
  }
}

/**
 * Helper to handle being on onboarding or dashboard after authentication
 */
async function handleOnboardingOrDashboard(
  page: import("@playwright/test").Page,
): Promise<boolean> {
  if (await isOnDashboard(page)) {
    console.log("✓ Already on dashboard");
    return true;
  }

  if (page.url().includes("/onboarding")) {
    console.log("📋 On onboarding - completing...");
    const skipButton = page.getByRole("button", { name: /skip for now/i });
    try {
      await skipButton.waitFor({ state: "visible", timeout: 5000 });
      await skipButton.click();
      await page.waitForTimeout(2000); // Give time for redirect
      if (await isOnDashboard(page)) {
        return true;
      }
    } catch {
      console.log("⚠️ Could not skip onboarding");
    }
  }

  return false;
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
    // Go to sign up page and wait for page to load
    await page.goto(`${baseURL}/signup`);
    // Don't use networkidle - Convex WebSockets keep it busy
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000); // Allow React to hydrate

    // Check current URL - we might have been redirected if already logged in
    const currentUrl = page.url();
    console.log(`📍 After navigating to /signup, current URL: ${currentUrl}`);

    // If we're already on onboarding or dashboard, we're authenticated
    if (currentUrl.includes("/onboarding") || currentUrl.includes("/dashboard")) {
      console.log("✓ Already authenticated, handling redirect...");
      return await handleOnboardingOrDashboard(page);
    }

    // Check for sign up form or onboarding heading
    const signUpHeading = page.getByRole("heading", { name: /create an account/i });
    const onboardingHeading = page.getByRole("heading", { name: /welcome to nixelo/i });

    // Wait for either to appear
    try {
      await Promise.race([
        signUpHeading.waitFor({ state: "visible", timeout: 5000 }),
        onboardingHeading.waitFor({ state: "visible", timeout: 5000 }),
      ]);
    } catch {
      // Neither appeared, check what we have
      console.log("⚠️ Neither sign-up nor onboarding heading visible");
    }

    // If we're on onboarding, we're already authenticated
    if (await onboardingHeading.isVisible().catch(() => false)) {
      console.log("✓ Already authenticated (on onboarding), completing...");
      return await handleOnboardingOrDashboard(page);
    }

    // If sign up form isn't visible, something went wrong
    if (!(await signUpHeading.isVisible().catch(() => false))) {
      console.log("⚠️ Sign up heading not visible, checking dashboard...");
      if (await isOnDashboard(page)) {
        return true;
      }
      return false;
    }

    // Click "Continue with email" to reveal form fields
    const formExpanded = await clickContinueWithEmail(page);
    if (!formExpanded) {
      console.log("⚠️ Could not expand sign-up form");
      return false;
    }

    // Fill form fields
    const emailInput = page.getByPlaceholder("Email");
    const passwordInput = page.getByPlaceholder("Password");

    await emailInput.fill(TEST_USERS.dashboard.email);
    await passwordInput.fill(TEST_USERS.dashboard.password);

    console.log(`📤 Signing up as ${TEST_USERS.dashboard.email}...`);

    // Wait for form to be ready (350ms delay in React component)
    await page.waitForTimeout(400);

    // After clicking "Continue with email", the button text changes to "Create account"
    const submitButton = page.getByRole("button", { name: "Create account", exact: true });
    await submitButton.waitFor({ state: "visible", timeout: 5000 });
    await submitButton.click();

    // Wait for either verification page, error toast, or redirect
    // The form stays on /signup but shows verification form or error toast
    const verificationHeading = page.getByRole("heading", { name: /verify your email/i });
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');

    // Poll for either state to appear (Promise.race with timeouts doesn't work well)
    let foundState: "verification" | "error" | "redirect" | null = null;
    const startTime = Date.now();
    const timeout = 15000;

    while (Date.now() - startTime < timeout && !foundState) {
      // Check for verification form
      if (await verificationHeading.isVisible().catch(() => false)) {
        foundState = "verification";
        break;
      }

      // Check for error toast (email already registered)
      if (await errorToast.isVisible().catch(() => false)) {
        foundState = "error";
        break;
      }

      // Check for redirect to onboarding/dashboard
      const currentUrl = page.url();
      if (currentUrl.includes("/onboarding") || currentUrl.includes("/dashboard")) {
        foundState = "redirect";
        break;
      }

      await page.waitForTimeout(500);
    }

    // Handle error case - email may already exist, should try sign-in
    if (foundState === "error") {
      console.log("⚠️ Sign-up error (email may already exist), trying sign-in instead...");
      return false; // Will trigger sign-in retry in caller
    }

    if (!foundState) {
      console.log("⚠️ Timed out waiting for sign-up result");
      await page.screenshot({ path: path.join(AUTH_DIR, "debug-signup-timeout.png") });
      return false;
    }

    // Check if email verification is required
    if (await verificationHeading.isVisible().catch(() => false)) {
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

      // Wait for navigation after verification
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });
      console.log("✓ Email verified");
    }

    // Handle onboarding if present
    if (
      page.url().includes("/onboarding") ||
      (await onboardingHeading.isVisible().catch(() => false))
    ) {
      console.log("📋 Completing onboarding...");
      const skipButton = page.getByRole("button", { name: /skip for now/i });
      await skipButton.waitFor({ state: "visible", timeout: 5000 });
      await skipButton.click();

      // Wait for redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    }

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

      // Step 3: If sign-up failed (e.g., email already exists), retry sign-in
      if (!success) {
        console.log("ℹ️ Sign-up failed, retrying sign-in...");
        success = await trySignIn(page, baseURL);
      }
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
