import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, chromium, type FullConfig, type Page } from "@playwright/test";
import { AUTH_PATHS, TEST_USERS, type TestUser } from "./config";
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
 * Try to sign in with specific user credentials
 */
async function trySignInUser(page: Page, baseURL: string, user: TestUser): Promise<boolean> {
  try {
    await page.goto(`${baseURL}/signin`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // Check if already logged in
    if (await isOnDashboard(page)) {
      return true;
    }

    // Wait for sign in form
    await page
      .getByRole("heading", { name: /welcome back/i })
      .waitFor({ state: "visible", timeout: 10000 });

    // Click "Continue with email"
    const formExpanded = await clickContinueWithEmail(page);
    if (!formExpanded) return false;

    // Fill credentials
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.waitForTimeout(400);

    // Submit
    const signInButton = page.getByRole("button", { name: "Sign in", exact: true });
    await signInButton.waitFor({ state: "visible", timeout: 5000 });
    await signInButton.click();

    // Wait for navigation
    try {
      await page.waitForURL(/\/(dashboard|onboarding)/, {
        timeout: 15000,
        waitUntil: "domcontentloaded",
      });
    } catch {
      // Check if we're there anyway
    }

    return await handleOnboardingOrDashboard(page);
  } catch {
    return false;
  }
}

/**
 * Sign up a specific user with email verification
 */
async function signUpUser(page: Page, baseURL: string, user: TestUser): Promise<boolean> {
  try {
    await page.goto(`${baseURL}/signup`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    if (currentUrl.includes("/onboarding") || currentUrl.includes("/dashboard")) {
      return await handleOnboardingOrDashboard(page);
    }

    const signUpHeading = page.getByRole("heading", { name: /create an account/i });
    await signUpHeading.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});

    if (!(await signUpHeading.isVisible().catch(() => false))) {
      if (await isOnDashboard(page)) return true;
      return false;
    }

    const formExpanded = await clickContinueWithEmail(page);
    if (!formExpanded) return false;

    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.waitForTimeout(400);

    const submitButton = page.getByRole("button", { name: "Create account", exact: true });
    await submitButton.waitFor({ state: "visible", timeout: 5000 });
    await submitButton.click();

    // Wait for verification or redirect
    const verificationHeading = page.getByRole("heading", { name: /verify your email/i });
    let foundState: "verification" | "redirect" | null = null;
    const startTime = Date.now();

    while (Date.now() - startTime < 15000 && !foundState) {
      if (await verificationHeading.isVisible().catch(() => false)) {
        foundState = "verification";
        break;
      }
      const url = page.url();
      if (url.includes("/onboarding") || url.includes("/dashboard")) {
        foundState = "redirect";
        break;
      }
      await page.waitForTimeout(500);
    }

    if (foundState === "verification") {
      console.log(`  📬 Waiting for verification email for ${user.email}...`);
      try {
        const otp = await waitForVerificationEmail(user.email, {
          timeout: 90000,
          pollInterval: 2000,
        });
        console.log(`  ✓ Retrieved OTP: ${otp}`);

        const codeInput = page.getByPlaceholder("8-digit code");
        await codeInput.waitFor({ state: "visible", timeout: 5000 });
        await codeInput.fill(otp);

        const verifyButton = page.getByRole("button", { name: /verify email/i });
        await verifyButton.click();
        await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });
      } catch (verifyError) {
        console.error(`  ❌ Email verification failed for ${user.email}:`, verifyError);
        return false;
      }
    }

    return await handleOnboardingOrDashboard(page);
  } catch (error) {
    console.error(`  ❌ Sign-up error for ${user.email}:`, error);
    return false;
  }
}

/**
 * Set up auth state for a specific test user
 */
async function setupTestUser(
  context: BrowserContext,
  page: Page,
  baseURL: string,
  userKey: string,
  user: TestUser,
  authPath: string,
): Promise<boolean> {
  const authStatePath = path.join(AUTH_DIR, path.basename(authPath));

  // Check if auth file already exists and is recent (less than 1 hour old)
  if (fs.existsSync(authStatePath)) {
    const stats = fs.statSync(authStatePath);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < 60 * 60 * 1000) {
      console.log(`  ✓ ${userKey}: Using existing auth state (${Math.round(ageMs / 60000)}m old)`);
      return true;
    }
  }

  console.log(`  🔧 ${userKey}: Setting up auth for ${user.email}...`);

  // Clear context storage before each user
  await context.clearCookies();

  // Try sign-in first
  let success = await trySignInUser(page, baseURL, user);

  // If sign-in failed, try sign-up
  if (!success) {
    console.log(`  ℹ️ ${userKey}: Sign-in failed, attempting sign-up...`);
    success = await signUpUser(page, baseURL, user);

    // Retry sign-in if sign-up failed (user might exist)
    if (!success) {
      console.log(`  ℹ️ ${userKey}: Sign-up failed, retrying sign-in...`);
      success = await trySignInUser(page, baseURL, user);
    }
  }

  if (success) {
    await context.storageState({ path: authStatePath });
    console.log(`  ✓ ${userKey}: Auth state saved`);
    return true;
  } else {
    console.warn(`  ⚠️ ${userKey}: Failed to create auth state`);
    await page.screenshot({ path: path.join(AUTH_DIR, `setup-error-${userKey}.png`) });
    return false;
  }
}

/**
 * Global setup - runs once before all tests
 *
 * Sets up auth state for all configured test users:
 * - dashboard: Default user for most tests
 * - admin: Platform admin user
 * - teamLead: Team lead user
 * - teamMember: Team member user
 * - viewer: Read-only user
 *
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL || "http://localhost:5555";

  // Clear Mailtrap inbox before tests
  console.log("📧 Clearing Mailtrap inbox...");
  await clearInbox();

  // Ensure .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const browser = await chromium.launch();

  // Define users to set up
  // Only set up dashboard user by default (others can be created on-demand)
  // Creating multiple users requires sequential email verification which is slow
  const usersToSetup: Array<{ key: string; user: TestUser; authPath: string }> = [
    { key: "dashboard", user: TEST_USERS.dashboard, authPath: AUTH_PATHS.dashboard },
    // Uncomment to create additional users (requires ~90s per user for email verification):
    // { key: "admin", user: TEST_USERS.admin, authPath: AUTH_PATHS.admin },
    // { key: "teamLead", user: TEST_USERS.teamLead, authPath: AUTH_PATHS.teamLead },
    // { key: "teamMember", user: TEST_USERS.teamMember, authPath: AUTH_PATHS.teamMember },
    // { key: "viewer", user: TEST_USERS.viewer, authPath: AUTH_PATHS.viewer },
  ];

  console.log(`\n👥 Setting up ${usersToSetup.length} test user(s)...\n`);

  for (const { key, user, authPath } of usersToSetup) {
    // Create fresh context for each user
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await setupTestUser(context, page, baseURL, key, user, authPath);
    } catch (error) {
      console.error(`  ❌ ${key}: Setup error:`, error);
      try {
        await page.screenshot({ path: path.join(AUTH_DIR, `setup-error-${key}.png`) });
      } catch {
        // Ignore
      }
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log("\n✅ Global setup complete\n");
}

export default globalSetup;
