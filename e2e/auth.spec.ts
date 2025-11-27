import { test, expect } from "./fixtures";

test.describe("Authentication - Sign In/Up Flow", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("shows sign in form for unauthenticated users", async ({ authPage }) => {
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.submitButton).toBeVisible();
    await expect(authPage.googleSignInButton).toBeVisible();
  });

  test("can switch between sign in and sign up", async ({ authPage }) => {
    // Initially on sign in
    await expect(authPage.submitButton).toHaveText(/sign in/i);

    // Switch to sign up
    await authPage.toggleFlowButton.click();
    await expect(authPage.submitButton).toHaveText(/sign up/i);

    // Switch back to sign in
    await authPage.toggleFlowButton.click();
    await expect(authPage.submitButton).toHaveText(/sign in/i);
  });

  test("shows forgot password link only on sign in", async ({ authPage }) => {
    // On sign in - forgot password visible
    await expect(authPage.forgotPasswordButton).toBeVisible();

    // Switch to sign up - forgot password hidden
    await authPage.toggleFlowButton.click();
    await expect(authPage.forgotPasswordButton).not.toBeVisible();
  });

  test("validates email format", async ({ authPage }) => {
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.emailInput).toHaveAttribute("required", "");
  });

  test("validates password required", async ({ authPage }) => {
    await expect(authPage.passwordInput).toHaveAttribute("required", "");
  });
});

test.describe("Authentication - Password Reset Flow", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("can navigate to forgot password", async ({ authPage }) => {
    await authPage.goToForgotPassword();

    await expect(authPage.resetHeading).toBeVisible();
    await expect(authPage.sendResetCodeButton).toBeVisible();
    await expect(authPage.backToSignInButton).toBeVisible();
  });

  test("can go back from forgot password", async ({ authPage }) => {
    await authPage.goToForgotPassword();
    await authPage.backToSignInButton.click();

    // Should be back at sign in
    await expect(authPage.submitButton).toBeVisible();
    await expect(authPage.forgotPasswordButton).toBeVisible();
  });

  test("forgot password form has email input", async ({ authPage }) => {
    await authPage.goToForgotPassword();

    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
  });
});

test.describe("Authentication - Google OAuth", () => {
  test("shows Google sign in button", async ({ authPage }) => {
    await authPage.goto();

    await expect(authPage.googleSignInButton).toBeVisible();
    await expect(authPage.googleSignInButton).toContainText(/google/i);
  });
});

// Tests requiring actual authentication - skip by default
test.describe("Authentication - Integration", () => {
  test.skip("sign up sends verification email", async ({ authPage }) => {
    // This would require:
    // 1. Test email service (e.g., Mailosaur)
    // 2. Real Convex backend running
    await authPage.goto();
    await authPage.signUp("test@example.com", "password123");

    // Would check for verification form
    await expect(authPage.verifyHeading).toBeVisible();
  });

  test.skip("can complete email verification", async ({ authPage }) => {
    // This would require getting OTP from test email service
    await authPage.goto();

    // Assume we're on verification screen
    await authPage.verifyEmail("12345678");

    // Should redirect to dashboard
    // await expect(dashboardPage.dashboardTab).toBeVisible();
  });
});
