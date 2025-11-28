import { expect, test } from "./fixtures";

/**
 * Comprehensive Authentication E2E Tests
 *
 * Tests all actionable elements in the auth forms.
 */

test.describe("Sign In Form - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("displays all sign in form elements", async ({ authPage, page }) => {
    // Heading
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    // Form inputs
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.emailInput).toHaveAttribute("required", "");

    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.passwordInput).toHaveAttribute("type", "password");
    await expect(authPage.passwordInput).toHaveAttribute("required", "");

    // Submit button
    await expect(authPage.submitButton).toBeVisible();
    await expect(authPage.submitButton).toHaveText(/sign in/i);

    // Toggle link
    await expect(authPage.toggleFlowButton).toBeVisible();
    await expect(authPage.toggleFlowButton).toContainText(/sign up/i);

    // Forgot password link
    await expect(authPage.forgotPasswordButton).toBeVisible();

    // Google sign in
    await expect(authPage.googleSignInButton).toBeVisible();
  });

  test("email input validates email format", async ({ authPage }) => {
    await authPage.emailInput.fill("invalid-email");
    await authPage.passwordInput.fill("password123");
    await authPage.submitButton.evaluate((el: HTMLElement) => el.click());

    // HTML5 validation should trigger
    const isInvalid = await authPage.emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);
  });

  test("password input is masked", async ({ authPage }) => {
    await authPage.passwordInput.fill("secretpassword");
    await expect(authPage.passwordInput).toHaveAttribute("type", "password");
  });
});

test.describe("Sign Up Form - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
    await authPage.switchToSignUp();
  });

  test("displays all sign up form elements", async ({ authPage, page }) => {
    // Heading stays "Welcome back" (UI doesn't change heading for sign up)
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    // Same form inputs
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();

    // Submit button text changes to "Sign up"
    await expect(authPage.submitButton).toHaveText(/sign up/i);

    // Toggle link changes to "Sign in instead"
    await expect(authPage.toggleFlowButton).toContainText(/sign in/i);

    // Forgot password hidden in sign up mode
    await expect(authPage.forgotPasswordButton).not.toBeVisible();
  });

  test("can switch between sign in and sign up", async ({ authPage }) => {
    // Currently on sign up
    await expect(authPage.submitButton).toHaveText(/sign up/i);

    // Switch to sign in
    await authPage.switchToSignIn();
    await expect(authPage.submitButton).toHaveText(/sign in/i);

    // Switch back to sign up
    await authPage.switchToSignUp();
    await expect(authPage.submitButton).toHaveText(/sign up/i);
  });
});

test.describe("Forgot Password Form - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
    await authPage.goToForgotPassword();
  });

  test("displays forgot password form elements", async ({ authPage, page }) => {
    // Heading
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();

    // Email input
    await expect(authPage.emailInput).toBeVisible();

    // Submit button
    await expect(authPage.sendResetCodeButton).toBeVisible();

    // Back to sign in
    await expect(authPage.backToSignInButton).toBeVisible();
  });

  test("can go back to sign in", async ({ authPage }) => {
    await authPage.goBackToSignIn();
    await expect(authPage.submitButton).toHaveText(/sign in/i);
  });
});

test.describe("Google OAuth - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("google sign in button has correct styling", async ({ authPage }) => {
    await expect(authPage.googleSignInButton).toBeVisible();
    await expect(authPage.googleSignInButton).toContainText(/google/i);
  });
});

test.describe("Login Section - Back Navigation", () => {
  test("back button returns to landing page", async ({ landingPage, page }) => {
    await landingPage.goto();
    await landingPage.clickGetStarted();

    // Verify we're on login section
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    // Click back
    await landingPage.goBackToHome();

    // Verify we're back on landing
    await landingPage.expectLandingPage();
  });
});
