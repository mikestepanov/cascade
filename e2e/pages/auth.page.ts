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

    // Wait for page to fully load
    await this.page.waitForLoadState("load");

    // Check if we're on the landing page (unauthenticated)
    // The landing page has a "Get Started Free" button in the hero section
    const getStartedButton = this.page.getByRole("button", {
      name: /get started free/i,
    });

    // Wait for button to appear (give page time to render)
    await getStartedButton.waitFor({ state: "visible", timeout: 10000 });

    // Use JavaScript click to bypass any overlays (animated SVG backgrounds)
    await getStartedButton.evaluate((el: HTMLElement) => el.click());

    // Wait for the login section to render (heading "Welcome back")
    await this.page
      .getByRole("heading", { name: /welcome back/i })
      .waitFor({ state: "visible", timeout: 15000 });

    // Wait for the form inputs to be ready
    await this.emailInput.waitFor({ state: "visible", timeout: 10000 });
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
    await this.submitButton.evaluate((el: HTMLElement) => el.click());
  }

  async signUp(email: string, password: string) {
    if (this.currentFlow !== "signUp") {
      await this.switchToSignUp();
    }
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.evaluate((el: HTMLElement) => el.click());
  }

  async switchToSignIn() {
    await this.toggleFlowButton.evaluate((el: HTMLElement) => el.click());
    this.currentFlow = "signIn";
    await expect(this.submitButton).toHaveText(/sign in/i, { timeout: 10000 });
  }

  async switchToSignUp() {
    await this.toggleFlowButton.evaluate((el: HTMLElement) => el.click());
    this.currentFlow = "signUp";
    await expect(this.submitButton).toHaveText(/sign up/i, { timeout: 10000 });
  }

  async signInWithGoogle() {
    await this.googleSignInButton.evaluate((el: HTMLElement) => el.click());
    // Note: Will redirect to Google OAuth
  }

  // ===================
  // Actions - Password Reset
  // ===================

  async goToForgotPassword() {
    await this.forgotPasswordButton.evaluate((el: HTMLElement) => el.click());
    await expect(this.resetHeading).toBeVisible({ timeout: 10000 });
  }

  async requestPasswordReset(email: string) {
    await this.goToForgotPassword();
    await this.emailInput.fill(email);
    await this.sendResetCodeButton.evaluate((el: HTMLElement) => el.click());
  }

  async completePasswordReset(code: string, newPassword: string) {
    await this.codeInput.fill(code);
    await this.newPasswordInput.fill(newPassword);
    await this.resetPasswordButton.evaluate((el: HTMLElement) => el.click());
  }

  async goBackToSignIn() {
    await this.backToSignInButton.evaluate((el: HTMLElement) => el.click());
    await expect(this.submitButton).toBeVisible({ timeout: 10000 });
  }

  // ===================
  // Actions - Email Verification
  // ===================

  async verifyEmail(code: string) {
    await this.verifyCodeInput.fill(code);
    await this.verifyEmailButton.evaluate((el: HTMLElement) => el.click());
  }

  async resendVerificationCode() {
    await this.resendCodeButton.evaluate((el: HTMLElement) => el.click());
  }

  async signOutFromVerification() {
    await this.signOutLink.evaluate((el: HTMLElement) => el.click());
  }

  // ===================
  // Assertions
  // ===================

  async expectSignInForm() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.googleSignInButton).toBeVisible();
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
    await expect(this.verifyHeading).toBeVisible();
    await expect(this.verifyCodeInput).toBeVisible();
    await expect(this.verifyEmailButton).toBeVisible();
  }

  async expectValidationError(field: "email" | "password") {
    const input = field === "email" ? this.emailInput : this.passwordInput;
    // HTML5 validation - check validity state
    const isInvalid = await input.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  }
}
