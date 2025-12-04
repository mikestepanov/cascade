import { expect, test } from "./fixtures";
import {
  getTestEmailAddress,
  isMailtrapConfigured,
  waitForVerificationEmail,
} from "./utils/mailtrap";

/**
 * Authentication E2E Tests
 *
 * Tests the sign in, sign up, password reset, and email verification flows.
 * Uses Page Object Model for maintainability.
 */

test.describe("Landing Page", () => {
  test("shows landing page for unauthenticated users", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.expectLandingPage();
  });

  test("can navigate to login from hero CTA", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickGetStarted();
    await landingPage.expectLoginSection();
  });

  test("can navigate to login from nav", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickNavGetStarted();
    await landingPage.expectLoginSection();
  });

  test("can go back to landing from login", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickGetStarted();
    await landingPage.goBackToHome();
    await landingPage.expectLandingPage();
  });
});

test.describe("Sign In / Sign Up", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("displays sign in form by default", async ({ authPage }) => {
    await authPage.expectSignInForm();
  });

  test("can toggle between sign in and sign up", async ({ authPage }) => {
    // Start on sign in
    await expect(authPage.submitButton).toHaveText(/sign in/i);
    await expect(authPage.forgotPasswordButton).toBeVisible();

    // Switch to sign up
    await authPage.switchToSignUp();
    await expect(authPage.submitButton).toHaveText(/sign up/i);
    await expect(authPage.forgotPasswordButton).not.toBeVisible();

    // Switch back to sign in
    await authPage.switchToSignIn();
    await expect(authPage.submitButton).toHaveText(/sign in/i);
  });

  test("shows Google sign in option", async ({ authPage }) => {
    await expect(authPage.googleSignInButton).toBeVisible();
    await expect(authPage.googleSignInButton).toContainText(/google/i);
  });

  test("validates required fields", async ({ authPage }) => {
    // Email required
    await expect(authPage.emailInput).toHaveAttribute("required", "");
    await expect(authPage.emailInput).toHaveAttribute("type", "email");

    // Password required
    await expect(authPage.passwordInput).toHaveAttribute("required", "");
  });
});

test.describe("Password Reset", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("can navigate to forgot password", async ({ authPage }) => {
    await authPage.goToForgotPassword();
    await authPage.expectForgotPasswordForm();
  });

  test("can go back to sign in", async ({ authPage }) => {
    await authPage.goToForgotPassword();
    await authPage.goBackToSignIn();

    await expect(authPage.submitButton).toBeVisible();
    await expect(authPage.forgotPasswordButton).toBeVisible();
  });

  test("forgot password form has email input", async ({ authPage }) => {
    await authPage.goToForgotPassword();

    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.emailInput).toHaveAttribute("required", "");
  });
});

/**
 * Integration tests - require running backend and Mailtrap configuration
 * These test the full sign up and email verification flow
 *
 * NOTE: Skipped due to Mailtrap sandbox monthly sending limits (100/month).
 * Re-enable when limits reset or use a different email testing provider.
 */
test.describe.skip("Integration", () => {
  test.describe.configure({ mode: "serial" });

  // Skip all tests if Mailtrap is not configured
  test.beforeEach(() => {
    test.skip(!isMailtrapConfigured(), "Mailtrap not configured - skipping integration tests");
  });

  test("sign up flow sends verification email", async ({ authPage }) => {
    const testEmail = getTestEmailAddress("signup-test");
    await authPage.goto();

    // Sign up with test email
    await authPage.signUp(testEmail, "TestPassword123!");

    // Should show verification form
    await authPage.expectVerificationForm();
  });

  test("can complete email verification", async ({ authPage, page }) => {
    const testEmail = getTestEmailAddress("verify-test");
    await authPage.goto();

    // Sign up with test email
    await authPage.signUp(testEmail, "TestPassword123!");

    // Wait for verification form
    await authPage.expectVerificationForm();

    // Get OTP from Mailtrap
    const otp = await waitForVerificationEmail(testEmail, {
      timeout: 60000,
      pollInterval: 3000,
    });

    // Enter the OTP
    await authPage.verifyEmail(otp);

    // Should either go to onboarding or dashboard
    await expect(
      page
        .getByRole("heading", { name: /welcome to nixelo/i })
        .or(page.getByRole("link", { name: /^dashboard$/i })),
    ).toBeVisible({ timeout: 15000 });
  });
});
