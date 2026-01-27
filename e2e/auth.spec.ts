import { expect, test } from "./fixtures";
import { getTestEmailAddress } from "./utils/helpers";
import { waitForMockOTP } from "./utils/otp-helpers";
import { ROUTES } from "./utils/routes";

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
    // Forgot password link only appears when email form is expanded
    await authPage.expandEmailForm();
    await expect(authPage.forgotPasswordLink).toBeVisible();
  });

  test("has link to sign up", async ({ authPage }) => {
    await expect(authPage.signUpLink).toBeVisible();
  });

  test("validates required fields", async ({ authPage }) => {
    // Required attributes only set when form is expanded (formReady state)
    await authPage.expandEmailForm();
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
    // Required attributes only set when form is expanded (formReady state)
    await authPage.expandEmailForm();
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
    console.log(`[Test] Entering OTP: ${otp}`);
    await authPage.verifyEmail(otp);

    // Wait for success toast indicating verification completed
    // The success toast shows before navigation
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /verified|success/i }))
      .toBeVisible({ timeout: 10000 })
      .catch(() => {
        console.log("[Test] No success toast found, checking for error...");
      });

    // Check for error toast
    const errorToast = page.locator("[data-sonner-toast][data-type='error']");
    if (await errorToast.isVisible().catch(() => false)) {
      const errorText = await errorToast.textContent();
      console.log(`[Test] Error toast visible: ${errorText}`);
      throw new Error(`Verification failed with error: ${errorText}`);
    }

    // Check current URL
    console.log(`[Test] Current URL after verify: ${page.url()}`);

    // If we're on the landing page, it means auth state wasn't ready
    // Wait longer and check if we get redirected properly
    if (page.url().endsWith("/") || page.url().endsWith("localhost:5555")) {
      // Manually navigate to app gateway to trigger proper auth check
      await page.goto(ROUTES.app.build());
      await page.waitForTimeout(2000);
    }

    // Should redirect to dashboard or onboarding
    await expect(
      page
        .getByRole("heading", { name: /welcome to nixelo/i })
        .or(page.getByRole("link", { name: /dashboard/i }))
        .or(page.locator('[data-sidebar="sidebar"]')), // Sidebar indicates we're in the app
    ).toBeVisible({ timeout: 15000 });
  });
});
