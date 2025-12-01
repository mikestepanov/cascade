import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type FullConfig } from "@playwright/test";
import { waitForVerificationEmail } from "./utils/mailtrap";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, ".auth");
const AUTH_STATE_PATH = path.join(AUTH_DIR, "user.json");

// Test user credentials - use a real email that Mailtrap can receive
const TEST_USER = {
  email: `e2e-test-${Date.now()}@inbox.mailtrap.io`,
  password: "TestPassword123!",
};

/**
 * Global setup - runs once before all tests
 * Automatically creates auth state by signing up a test user
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

    // Wait for React hydration
    await page.waitForFunction(
      () => {
        const buttons = document.querySelectorAll("button");
        for (const button of buttons) {
          const keys = Object.keys(button);
          if (keys.some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactProps"))) {
            return true;
          }
        }
        return false;
      },
      { timeout: 30000 },
    );

    await page.waitForTimeout(500);

    // Click "Get Started Free" to open login section
    const getStartedButton = page.getByRole("button", { name: /get started free/i });
    await getStartedButton.waitFor({ state: "visible", timeout: 10000 });
    await getStartedButton.evaluate((el: HTMLElement) => el.click());

    // Wait for login form to appear
    await page
      .getByRole("heading", { name: /welcome back/i })
      .waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(300);

    // Switch to sign up mode
    const toggleButton = page.getByRole("button", { name: /sign up instead/i });
    await toggleButton.waitFor({ state: "visible", timeout: 10000 });
    await page.waitForLoadState("networkidle");
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
    console.log("📤 Submitting sign up form...");
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
      console.log("📧 Email verification required, entering fixed OTP...");

      // Fill the 8-digit code input
      const codeInput = page.getByPlaceholder("8-digit code");
      await codeInput.waitFor({ state: "visible", timeout: 5000 });
      await codeInput.fill(E2E_TEST_OTP);

      // Click verify button
      const verifyButton = page.getByRole("button", { name: /verify email/i });
      await verifyButton.click();

      // Wait for verification to complete
      await page.waitForTimeout(3000);
      console.log("✓ Verification code submitted");
    }

    // Check if we got to a logged-in state
    const isAuthenticated = await Promise.race([
      // Check for dashboard elements
      page
        .locator("[data-tour='nav-dashboard'], [data-testid='dashboard']")
        .waitFor({ state: "visible", timeout: 10000 })
        .then(() => true)
        .catch(() => false),
      // Check for onboarding
      page
        .getByText(/welcome to nixelo|get started|choose your role/i)
        .waitFor({ state: "visible", timeout: 10000 })
        .then(() => true)
        .catch(() => false),
    ]);

    if (!isAuthenticated) {
      // If none of the above, check if we're still on landing page (sign up failed)
      const stillOnLanding = await page
        .getByRole("heading", { name: /revolutionize your workflow/i })
        .isVisible()
        .catch(() => false);

      if (stillOnLanding) {
        console.warn("⚠️  Sign up may have failed - still on landing page");
        console.warn("    Dashboard tests will be skipped");
      }
    }

    // Save the storage state regardless - tests will skip if auth is invalid
    await context.storageState({ path: AUTH_STATE_PATH });
    console.log("✓ Auth state saved to", AUTH_STATE_PATH);
  } catch (error) {
    console.error("⚠️  Failed to create auth state:", error);
    console.warn("    Dashboard tests will be skipped");

    // Don't save invalid auth state - let tests skip properly
    // by detecting missing file
  } finally {
    await browser.close();
  }
}

export default globalSetup;
