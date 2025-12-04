import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Authentication Page Object
 * Handles sign in, sign up, password reset, and email verification flows
 *
 * Routes:
 * - /signin - Sign in form
 * - /signup - Sign up form
 * - /forgot-password - Password reset flow
 */
export class AuthPage extends BasePage {
  // ===================
  // Locators - Page Headings
  // ===================
  readonly signInHeading: Locator;
  readonly signUpHeading: Locator;
  readonly forgotPasswordHeading: Locator;
  readonly resetPasswordHeading: Locator;

  // ===================
  // Locators - Sign In/Up Forms
  // ===================
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly googleSignInButton: Locator;
  readonly signUpLink: Locator;
  readonly signInLink: Locator;

  // ===================
  // Locators - Password Reset
  // ===================
  readonly sendResetCodeButton: Locator;
  readonly backToSignInLink: Locator;
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

    // Page headings
    this.signInHeading = page.getByRole("heading", { name: /welcome back/i });
    this.signUpHeading = page.getByRole("heading", { name: /create an account/i });
    this.forgotPasswordHeading = page.getByRole("heading", { name: /forgot password/i });
    this.resetPasswordHeading = page.getByRole("heading", { name: /reset password/i });

    // Sign In / Sign Up form inputs
    this.emailInput = page.getByPlaceholder("Email");
    this.passwordInput = page.getByPlaceholder("Password");
    this.signInButton = page.getByRole("button", { name: /^sign in$/i });
    this.signUpButton = page.getByRole("button", { name: /^create account$/i });
    this.forgotPasswordLink = page.getByRole("button", { name: /forgot password/i });
    this.googleSignInButton = page.getByRole("button", { name: /sign in with google/i });

    // Navigation links between auth pages
    this.signUpLink = page.getByRole("link", { name: /sign up/i });
    this.signInLink = page.getByRole("link", { name: /sign in/i });

    // Password Reset
    this.sendResetCodeButton = page.getByRole("button", { name: /send reset code/i });
    this.backToSignInLink = page.getByRole("link", { name: /back to sign in/i });
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
   * Navigate to sign in page
   */
  async goto() {
    await this.gotoSignIn();
  }

  /**
   * Navigate directly to sign in page
   */
  async gotoSignIn() {
    await this.page.goto("/signin");
    await this.waitForLoad();
    await this.signInHeading.waitFor({ state: "visible", timeout: 10000 });
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Navigate directly to sign up page
   */
  async gotoSignUp() {
    await this.page.goto("/signup");
    await this.waitForLoad();
    await this.signUpHeading.waitFor({ state: "visible", timeout: 10000 });
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Navigate directly to forgot password page
   */
  async gotoForgotPassword() {
    await this.page.goto("/forgot-password");
    await this.waitForLoad();
    await this.forgotPasswordHeading.waitFor({ state: "visible", timeout: 10000 });
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Navigate directly to landing page
   */
  async gotoLanding() {
    await this.page.goto("/");
    await this.waitForLoad();
  }

  // ===================
  // Actions - Sign In/Up
  // ===================

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async signUp(email: string, password: string) {
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
    await this.emailInput.fill(email);
    await this.passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await this.passwordInput.fill(password);
    await this.page.waitForTimeout(500);

    // Retry clicking submit until page changes (verification form or error)
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.signUpButton.waitFor({ state: "visible", timeout: 5000 });
      await this.signUpButton.click();
      await this.page.waitForTimeout(2000);

      // Check if we left the sign-up form
      const stillOnSignUp = await this.signUpButton.isVisible().catch(() => false);
      if (!stillOnSignUp) {
        return;
      }
      await this.page.waitForTimeout(500);
    }
    await this.page.waitForTimeout(2000);
  }

  async navigateToSignUp() {
    await this.signUpLink.click();
    await this.signUpHeading.waitFor({ state: "visible", timeout: 10000 });
  }

  async navigateToSignIn() {
    await this.signInLink.click();
    await this.signInHeading.waitFor({ state: "visible", timeout: 10000 });
  }

  async signInWithGoogle() {
    await this.googleSignInButton.waitFor({ state: "visible", timeout: 5000 });
    await this.googleSignInButton.click();
    // Note: Will redirect to Google OAuth
  }

  // ===================
  // Actions - Password Reset
  // ===================

  async clickForgotPassword() {
    await this.forgotPasswordLink.waitFor({ state: "visible", timeout: 10000 });
    await this.forgotPasswordLink.click();
    await this.forgotPasswordHeading.waitFor({ state: "visible", timeout: 10000 });
  }

  async requestPasswordReset(email: string) {
    await this.emailInput.fill(email);
    await this.sendResetCodeButton.click();
  }

  async completePasswordReset(code: string, newPassword: string) {
    await this.codeInput.fill(code);
    await this.newPasswordInput.fill(newPassword);
    await this.resetPasswordButton.click();
  }

  async goBackToSignIn() {
    await this.backToSignInLink.waitFor({ state: "visible", timeout: 10000 });
    await this.backToSignInLink.click();
    await this.signInHeading.waitFor({ state: "visible", timeout: 10000 });
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
    await expect(this.signInHeading).toBeVisible({ timeout: 10000 });
    await expect(this.emailInput).toBeVisible({ timeout: 5000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 5000 });
    await expect(this.signInButton).toBeVisible({ timeout: 5000 });
    await expect(this.googleSignInButton).toBeVisible({ timeout: 5000 });
  }

  async expectSignUpForm() {
    await expect(this.signUpHeading).toBeVisible({ timeout: 10000 });
    await expect(this.emailInput).toBeVisible({ timeout: 5000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 5000 });
    await expect(this.signUpButton).toBeVisible({ timeout: 5000 });
  }

  async expectForgotPasswordForm() {
    await expect(this.forgotPasswordHeading).toBeVisible({ timeout: 10000 });
    await expect(this.emailInput).toBeVisible();
    await expect(this.sendResetCodeButton).toBeVisible();
  }

  async expectResetCodeForm() {
    await expect(this.resetPasswordHeading).toBeVisible({ timeout: 10000 });
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
