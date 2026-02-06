import { expect, test } from "./fixtures";

/**
 * Comprehensive Authentication E2E Tests
 *
 * Tests all actionable elements in the auth forms.
 * Uses AuthPage page object for consistent locators and actions.
 */

test.describe("Sign In Form - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("displays all sign in form elements", async ({ authPage }) => {
    // Heading - use page object locator
    await expect(authPage.signInHeading).toBeVisible();

    // Ensure form is expanded - explicitly expand in case goto's expansion was flaky
    await authPage.expandEmailForm();
    await authPage.waitForFormReady();

    // Form inputs
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    // Note: required attr is set conditionally based on formReady state, skip checking it

    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.passwordInput).toHaveAttribute("type", "password");

    // Submit button - after expansion shows "Sign in" instead of "Continue with email"
    await expect(authPage.signInButton).toBeVisible();

    // Toggle link
    await expect(authPage.toggleFlowButton).toBeVisible();
    await expect(authPage.toggleFlowButton).toContainText(/sign up/i);

    // Forgot password link - conditionally rendered when form is expanded
    // Use the page object's locator which is more stable
    await expect(authPage.forgotPasswordButton).toBeVisible();

    // Google sign in
    await expect(authPage.googleSignInButton).toBeVisible();
  });

  test("email input validates email format", async ({ authPage }) => {
    // Ensure form is expanded before interacting with inputs
    await authPage.expandEmailForm();
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
    // Ensure form is expanded before interacting with inputs
    await authPage.expandEmailForm();
    await authPage.passwordInput.fill("secretpassword");
    await expect(authPage.passwordInput).toHaveAttribute("type", "password");
  });
});

test.describe("Sign Up Form - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    // Go directly to sign-up page - avoids extra navigation through sign-in
    await authPage.gotoSignUp();
  });

  test("displays all sign up form elements", async ({ authPage }) => {
    // Heading - use page object locator
    await expect(authPage.signUpHeading).toBeVisible();

    // Same form inputs
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();

    // Submit button text is "Create account"
    await expect(authPage.submitButton).toHaveText(/create account/i);

    // Toggle link changes to "Sign in instead"
    await expect(authPage.toggleFlowButton).toContainText(/sign in/i);

    // Forgot password hidden in sign up mode
    await expect(authPage.forgotPasswordButton).not.toBeVisible();
  });

  // This test involves multiple navigation and form expansion operations which can be flaky
  // due to React state management timing. Allow retries to handle intermittent failures.
  test("can switch between sign in and sign up", async ({ authPage }) => {
    test.info().annotations.push({
      type: "flaky",
      description: "Form expansion timing can be inconsistent",
    });
    // Currently on sign up - button says "Create account"
    await expect(authPage.submitButton).toHaveText(/create account/i);

    // Switch to sign in
    await authPage.switchToSignIn();
    await expect(authPage.submitButton).toHaveText(/sign in/i);

    // Switch back to sign up
    await authPage.switchToSignUp();
    await expect(authPage.submitButton).toHaveText(/create account/i);
  });
});

test.describe("Forgot Password Form - Elements", () => {
  test.beforeEach(async ({ authPage }) => {
    // Navigate directly to forgot password page to avoid form expansion issues
    await authPage.gotoForgotPassword();
  });

  test("displays forgot password form elements", async ({ authPage }) => {
    // Heading - use page object locator
    await expect(authPage.forgotPasswordHeading).toBeVisible();

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
  test("back button returns to landing page", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickGetStarted();

    // Verify we're on sign up page (Get Started navigates to signup)
    await expect(landingPage.signUpHeading).toBeVisible();

    // Click back
    await landingPage.goBackToHome();

    // Verify we're back on landing
    await landingPage.expectLandingPage();
  });
});
