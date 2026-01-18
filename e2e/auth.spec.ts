import { expect, test } from "./fixtures";
import { getTestEmailAddress } from "./utils/mailtrap";
import { waitForMockOTP } from "./utils/otp-helpers";

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

  test("can navigate to signup from hero CTA", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickGetStarted();
    await landingPage.expectSignUpPage();
  });

  test("can navigate to signup from nav", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickNavGetStarted();
    await landingPage.expectSignUpPage();
  });

  test("can navigate to signin from nav", async ({ landingPage }) => {
    await landingPage.goto();
    await landingPage.clickNavLogin();
    await landingPage.expectSignInPage();
  });
});

test.describe("Sign In Page", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoSignIn();
  });

  test("displays sign in form", async ({ authPage }) => {
    await authPage.expectSignInForm();
  });

  test("shows Google sign in option", async ({ authPage }) => {
    await expect(authPage.googleSignInButton).toBeVisible();
    await expect(authPage.googleSignInButton).toContainText(/google/i);
  });

  test("has link to forgot password", async ({ authPage }) => {
    await expect(authPage.forgotPasswordLink).toBeVisible();
  });

  test("has link to sign up", async ({ authPage }) => {
    await expect(authPage.signUpLink).toBeVisible();
  });

  test("validates required fields", async ({ authPage }) => {
    await expect(authPage.emailInput).toHaveAttribute("required", "");
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.passwordInput).toHaveAttribute("required", "");
  });
});

test.describe("Sign Up Page", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoSignUp();
  });

  test("displays sign up form", async ({ authPage }) => {
    await authPage.expectSignUpForm();
  });

  test("has link to sign in", async ({ authPage }) => {
    await expect(authPage.signInLink).toBeVisible();
  });

  test("validates required fields", async ({ authPage }) => {
    await expect(authPage.emailInput).toHaveAttribute("required", "");
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.passwordInput).toHaveAttribute("required", "");
  });
});

test.describe("Password Reset", () => {
  test("can navigate to forgot password from sign in", async ({ authPage }) => {
    await authPage.gotoSignIn();
    await authPage.clickForgotPassword();
    await authPage.expectForgotPasswordForm();
  });

  test("can go directly to forgot password", async ({ authPage }) => {
    await authPage.gotoForgotPassword();
    await authPage.expectForgotPasswordForm();
  });

  test("can go back to sign in", async ({ authPage }) => {
    await authPage.gotoForgotPassword();
    await authPage.goBackToSignIn();
    await authPage.expectSignInForm();
  });

  test("forgot password form has email input", async ({ authPage }) => {
    await authPage.gotoForgotPassword();
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.emailInput).toHaveAttribute("type", "email");
    await expect(authPage.emailInput).toHaveAttribute("required", "");
  });
});

/**
 * Integration tests - require running backend
 * These test the full sign up and email verification flow
 *
 * NOTE: Uses Mock OTP (direct DB read) instead of Mailtrap
 * to avoid cost/limits and improve speed.
 */
test.describe("Integration", () => {
  test.describe.configure({ mode: "serial" });

  test("sign up flow sends verification email", async ({ authPage }) => {
    const testEmail = getTestEmailAddress("signup-test");
    await authPage.gotoSignUp();

    // Sign up with test email
    await authPage.signUp(testEmail, "TestPassword123!");

    // Should show verification form
    await authPage.expectVerificationForm();
  });

  test("can complete email verification", async ({ authPage, page }) => {
    const testEmail = getTestEmailAddress("verify-test");
    await authPage.gotoSignUp();

    // Sign up with test email
    await authPage.signUp(testEmail, "TestPassword123!");

    // Wait for verification form
    await authPage.expectVerificationForm();

    // Get OTP from Mock Backend (fast, free, robust)
    const otp = await waitForMockOTP(testEmail);

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
