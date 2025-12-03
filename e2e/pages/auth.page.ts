import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Authentication Page Object
 * Handles sign in, sign up, password reset, and email verification flows
 */
export class AuthPage extends BasePage {
  // Form state
  private currentFlow: "signIn" | "signUp" = "signIn";

  // ===================
  // Locators - Sign In/Up
  // ===================
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly toggleFlowButton: Locator;
  readonly forgotPasswordButton: Locator;
  readonly googleSignInButton: Locator;

  // ===================
  // Locators - Password Reset
  // ===================
  readonly resetHeading: Locator;
  readonly sendResetCodeButton: Locator;
  readonly backToSignInButton: Locator;
  readonly codeInput: Locator;
  readonly newPasswordInput: Locator;
  readonly resetPasswordButton: Locator;

  // ===================
  // Locators - Email Verification
  // ===================
  readonly verifyHeading: Locator;
  readonly verifyCodeInput: Locator;
  readonly verifyEmailButton: Locator;
  readonly resendCodeButton: Locator;
  readonly signOutLink: Locator;

  constructor(page: Page) {
    super(page);

    // Sign In / Sign Up form
    this.emailInput = page.getByPlaceholder("Email");
    this.passwordInput = page.getByPlaceholder("Password");
    this.submitButton = page.getByRole("button", { name: /^sign (in|up)$/i });
    this.toggleFlowButton = page.getByRole("button", { name: /sign (in|up) instead/i });
    this.forgotPasswordButton = page.getByRole("button", { name: /forgot password/i });
    this.googleSignInButton = page.getByRole("button", { name: /sign in with google/i });

    // Password Reset - Step 1
    this.resetHeading = page.getByRole("heading", { name: /reset your password/i });
    this.sendResetCodeButton = page.getByRole("button", { name: /send reset code/i });
    this.backToSignInButton = page.getByRole("button", { name: /back to sign in/i });

    // Password Reset - Step 2
    this.codeInput = page.getByPlaceholder("8-digit code");
    this.newPasswordInput = page.getByPlaceholder("New password");
    this.resetPasswordButton = page.getByRole("button", { name: /^reset password$/i });

    // Email Verification
    this.verifyHeading = page.getByRole("heading", { name: /verify your email/i });
    this.verifyCodeInput = page.getByPlaceholder(/enter.*code|8-digit code/i);
    this.verifyEmailButton = page.getByRole("button", { name: /verify email/i });
    this.resendCodeButton = page.getByRole("button", { name: /didn't receive|resend/i });
    this.signOutLink = page.getByRole("button", { name: /sign out|different account/i });
  }

  // ===================
  // Navigation
  // ===================

  /**
   * Navigate to the auth page
   * Since unauthenticated users land on NixeloLanding, we need to click through
   */
  async goto() {
    await this.page.goto("/");

    // Wait for page to fully load and React to hydrate
    await this.waitForLoad();

    // Check if we're on the landing page (unauthenticated)
    // The landing page has a "Get Started Free" link in the hero section
    const getStartedButton = this.page.getByRole("link", {
      name: /get started free/i,
    });

    // Wait for button to appear and be enabled
    await getStartedButton.waitFor({ state: "visible", timeout: 10000 });

    // Use evaluate to call native click which React intercepts
    await getStartedButton.evaluate((el: HTMLElement) => el.click());

    // Wait for login section to appear
    const welcomeHeading = this.page.getByRole("heading", { name: /welcome back/i });
    await welcomeHeading.waitFor({ state: "visible", timeout: 10000 });

    // Let React finish rendering the login form
    await this.page.waitForTimeout(300);

    // Wait for all form inputs to be ready
    await this.emailInput.waitFor({ state: "visible", timeout: 10000 });
    await this.passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await this.googleSignInButton.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Navigate directly to landing page without clicking through
   */
  async gotoLanding() {
    await this.page.goto("/");
    await this.waitForLoad();
  }

  // ===================
  // Actions - Sign In/Up
  // ===================

  async signIn(email: string, password: string) {
    if (this.currentFlow !== "signIn") {
      await this.switchToSignIn();
    }
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async signUp(email: string, password: string) {
    if (this.currentFlow !== "signUp") {
      await this.switchToSignUp();
    }
    // Wait for form to be ready after mode switch
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
    await this.emailInput.fill(email);
    await this.passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await this.passwordInput.fill(password);
    // Wait for React to process the input values
    await this.page.waitForTimeout(500);

    // Retry clicking submit until page changes (verification form or error)
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.submitButton.waitFor({ state: "visible", timeout: 5000 });
      await this.submitButton.click();
      // Wait for potential page change
      await this.page.waitForTimeout(2000);

      // Check if we left the sign-up form (verification page, error, or dashboard)
      const stillOnSignUp = await this.submitButton.textContent()
        .then(text => text?.toLowerCase().includes("sign up"))
        .catch(() => false);

      if (!stillOnSignUp) {
        return; // Successfully submitted
      }
      // Still on sign-up form, retry
      await this.page.waitForTimeout(500);
    }
    // After retries, wait a bit more and hope it worked
    await this.page.waitForTimeout(2000);
  }

  async switchToSignIn() {
    await this.toggleFlowButton.waitFor({ state: "visible", timeout: 5000 });
    await this.toggleFlowButton.evaluate((el: HTMLElement) => el.click());
    this.currentFlow = "signIn";
    await expect(this.submitButton).toHaveText(/sign in/i, { timeout: 10000 });
  }

  async switchToSignUp() {
    // Retry clicking the toggle button until the form switches to sign-up mode
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.toggleFlowButton.waitFor({ state: "visible", timeout: 5000 });
      // Wait for React hydration
      await this.page.waitForTimeout(500);
      // Click the toggle button
      await this.toggleFlowButton.click();
      // Wait for UI to potentially update
      await this.page.waitForTimeout(500);
      // Check if the button text changed
      const buttonText = await this.submitButton.textContent();
      if (buttonText?.toLowerCase().includes("sign up")) {
        this.currentFlow = "signUp";
        return;
      }
      // If not changed, wait and retry
      await this.page.waitForTimeout(500);
    }
    // Final assertion - will fail with helpful error if still not changed
    this.currentFlow = "signUp";
    await expect(this.submitButton).toHaveText(/sign up/i, { timeout: 5000 });
  }

  async signInWithGoogle() {
    await this.googleSignInButton.waitFor({ state: "visible", timeout: 5000 });
    await this.googleSignInButton.click();
    // Note: Will redirect to Google OAuth
  }

  // ===================
  // Actions - Password Reset
  // ===================

  async goToForgotPassword() {
    // Wait for button to be visible
    await this.forgotPasswordButton.waitFor({ state: "visible", timeout: 10000 });

    // Use evaluate to call native click which React intercepts
    await this.forgotPasswordButton.evaluate((el: HTMLElement) => el.click());

    // Wait for reset heading to appear
    await this.resetHeading.waitFor({ state: "visible", timeout: 10000 });
  }

  async requestPasswordReset(email: string) {
    await this.goToForgotPassword();
    await this.emailInput.fill(email);
    await this.sendResetCodeButton.click();
  }

  async completePasswordReset(code: string, newPassword: string) {
    await this.codeInput.fill(code);
    await this.newPasswordInput.fill(newPassword);
    await this.resetPasswordButton.click();
  }

  async goBackToSignIn() {
    await this.backToSignInButton.waitFor({ state: "visible", timeout: 10000 });
    await this.backToSignInButton.evaluate((el: HTMLElement) => el.click());
    await this.submitButton.waitFor({ state: "visible", timeout: 10000 });
  }

  // ===================
  // Actions - Email Verification
  // ===================

  async verifyEmail(code: string) {
    await this.verifyCodeInput.fill(code);
    await this.verifyEmailButton.click({ force: true });
  }

  async resendVerificationCode() {
    await this.resendCodeButton.click({ force: true });
  }

  async signOutFromVerification() {
    await this.signOutLink.click({ force: true });
  }

  // ===================
  // Assertions
  // ===================

  async expectSignInForm() {
    await expect(this.emailInput).toBeVisible({ timeout: 10000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 5000 });
    await expect(this.submitButton).toBeVisible({ timeout: 5000 });
    await expect(this.googleSignInButton).toBeVisible({ timeout: 5000 });
  }

  async expectForgotPasswordForm() {
    await expect(this.resetHeading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.sendResetCodeButton).toBeVisible();
  }

  async expectResetCodeForm() {
    await expect(this.codeInput).toBeVisible();
    await expect(this.newPasswordInput).toBeVisible();
    await expect(this.resetPasswordButton).toBeVisible();
  }

  async expectVerificationForm() {
    // Wait longer for verification form to appear - server might be slow after sign-up
    await expect(this.verifyHeading).toBeVisible({ timeout: 15000 });
    await expect(this.verifyCodeInput).toBeVisible({ timeout: 5000 });
    await expect(this.verifyEmailButton).toBeVisible({ timeout: 5000 });
  }

  async expectValidationError(field: "email" | "password") {
    const input = field === "email" ? this.emailInput : this.passwordInput;
    // HTML5 validation - check validity state
    const isInvalid = await input.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  }
}
