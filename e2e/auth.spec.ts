import { expect, test } from "./fixtures";

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
 * Post-Login Navigation Tests
 * Verifies users see dashboard after successful authentication
 */
test.describe("Post-Login Navigation", () => {
  test("authenticated user should see dashboard by default", async () => {
    // This test requires auth state - skip if not set up
    // Use authenticatedTest fixture for actual authenticated tests
    test.skip();
  });
});

/**
 * Integration tests - require running backend
 * These test the full flow including API calls
 */
test.describe("Integration", () => {
  // Skip by default - enable when running against real backend
  test.describe.configure({ mode: "serial" });

  test.skip("sign up flow sends verification email", async ({ authPage }) => {
    await authPage.goto();

    // Sign up with test email
    await authPage.signUp("test@example.com", "TestPassword123!");

    // Should show verification form
    await authPage.expectVerificationForm();
  });

  test.skip("password reset flow sends code", async ({ authPage }) => {
    await authPage.goto();

    // Request password reset
    await authPage.requestPasswordReset("existing@example.com");

    // Should show code entry form
    await authPage.expectResetCodeForm();
  });

  test.skip("can complete email verification", async ({ authPage }) => {
    // This would require:
    // 1. Getting OTP from test email service
    // 2. Entering the code
    await authPage.goto();
    await authPage.verifyEmail("12345678");
  });
});
