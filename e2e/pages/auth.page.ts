import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Authentication Page Object
 * Handles sign in, sign up, password reset, and email verification flows
 *
 * Note: Sign In/Sign Up forms have a two-step flow:
 * 1. Click "Continue with email" to reveal form fields
 * 2. Fill email/password and submit
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
  readonly continueWithEmailButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly googleSignInButton: Locator;
  readonly signUpLink: Locator;
  readonly signInLink: Locator;

  /**
   * Dynamic submit button - returns signInButton or signUpButton based on visibility
   * Used by tests that need a generic submit button reference
   */
  get submitButton(): Locator {
    // Return a locator that matches either button
    return this.page.getByRole("button", { name: /^(sign in|create account)$/i });
  }

  /**
   * Dynamic toggle flow button - returns sign up or sign in link based on current page
   * On sign-in page: shows "Sign up" link
   * On sign-up page: shows "Sign in" link
   */
  get toggleFlowButton(): Locator {
    // Return a locator that matches the navigation link between sign-in and sign-up
    return this.page.getByRole("link", { name: /sign (in|up)/i });
  }

  /**
   * Alias for forgotPasswordLink - some tests reference it as forgotPasswordButton
   */
  get forgotPasswordButton(): Locator {
    return this.forgotPasswordLink;
  }

  /**
   * Alias for backToSignInLink - some tests reference it as backToSignInButton
   */
  get backToSignInButton(): Locator {
    return this.backToSignInLink;
  }

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

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Page headings
    this.signInHeading = page.getByRole("heading", { name: /welcome back/i });
    this.signUpHeading = page.getByRole("heading", { name: /create an account/i });
    this.forgotPasswordHeading = page.getByText("Forgot Password", { exact: false });
    this.resetPasswordHeading = page.getByRole("heading", { name: /reset password/i });

    // Sign In / Sign Up form - two-step flow
    this.continueWithEmailButton = page.getByRole("button", { name: /continue with email/i });
    this.emailInput = page.getByPlaceholder("Email");
    this.passwordInput = page.getByPlaceholder("Password");
    // These buttons appear after clicking "Continue with email"
    this.signInButton = page.getByRole("button", { name: "Sign in", exact: true });
    this.signUpButton = page.getByRole("button", { name: "Create account", exact: true });
    this.forgotPasswordLink = page.getByText("Forgot password?");
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
   * Navigate to sign in page and expand email form
   */
  async gotoSignIn() {
    await this.page.goto("/signin");
    await this.page.waitForLoadState("networkidle");
    await this.signInHeading.waitFor({ state: "visible", timeout: 10000 });
    // Expand form using robust click logic
    await this.expandEmailForm();
  }

  /**
   * Navigate to sign up page and expand email form
   */
  async gotoSignUp() {
    await this.page.goto("/signup");
    await this.page.waitForLoadState("networkidle");
    await this.signUpHeading.waitFor({ state: "visible", timeout: 10000 });
    // Expand form using robust click logic
    await this.expandEmailForm();
  }

  /**
   * Navigate directly to forgot password page
   */
  async gotoForgotPassword() {
    await this.page.goto("/forgot-password");
    await this.page.waitForLoadState("networkidle");
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
  // Actions - Form Expansion
  // ===================

  /**
   * Expand the email form by clicking "Continue with email"
   * Call this after navigating if form is collapsed
   * Uses multiple strategies to handle React hydration timing
   */
  async expandEmailForm() {
    // Check if form is expanded by looking for the submit button (Sign in or Create account)
    const submitButtonLocator = this.page.getByRole("button", {
      name: /^(sign in|create account)$/i,
    });
    const isFormExpanded = await submitButtonLocator.isVisible().catch(() => false);

    if (!isFormExpanded) {
      // Wait for button to be attached and visible before clicking
      await this.continueWithEmailButton.waitFor({ state: "attached", timeout: 5000 });
      await this.continueWithEmailButton.waitFor({ state: "visible", timeout: 5000 });

      // Give React time to attach event handlers after hydration
      await this.page.waitForTimeout(500);

      // Try clicking with multiple strategies
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Use evaluate to trigger a proper click that React will handle
          await this.continueWithEmailButton.evaluate((btn) => {
            const event = new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              view: window,
            });
            btn.dispatchEvent(event);
          });

          // Wait for form to expand
          await submitButtonLocator.waitFor({ state: "visible", timeout: 3000 });
          break;
        } catch {
          if (attempt < 3) {
            await this.page.waitForTimeout(500);
          } else {
            // Final fallback: try Playwright's native click
            await this.continueWithEmailButton.click({ timeout: 5000 });
            await submitButtonLocator.waitFor({ state: "visible", timeout: 3000 });
          }
        }
      }

      // Wait for formReady state using data-form-ready attribute
      await this.waitForFormReady();
    }
  }

  // ===================
  // Actions - Sign In/Up
  // ===================

  async signIn(email: string, password: string) {
    await this.expandEmailForm();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async signUp(email: string, password: string) {
    await this.expandEmailForm();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signUpButton.click();
  }

  async navigateToSignUp() {
    await this.signUpLink.click();
    await this.signUpHeading.waitFor({ state: "visible", timeout: 10000 });
  }

  async navigateToSignIn() {
    await this.signInLink.click();
    await this.signInHeading.waitFor({ state: "visible", timeout: 10000 });
  }

  async switchToSignUp() {
    await this.navigateToSignUp();
    await this.expandEmailForm();
  }

  async switchToSignIn() {
    await this.navigateToSignIn();
    await this.expandEmailForm();
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
    // Forgot password link appears after form is expanded
    await this.expandEmailForm();
    // Wait for form to stabilize (formReady state) before clicking
    await this.waitForFormReady();
    await this.forgotPasswordLink.waitFor({ state: "visible", timeout: 10000 });
    await expect(this.forgotPasswordLink).toBeEnabled();

    // Retry logic for robust clicking with navigation verification
    await expect(async () => {
      // Try clicking
      try {
        await this.forgotPasswordLink.click({ timeout: 1000 });
      } catch {
        // Fallback to JS click
        await this.forgotPasswordLink.evaluate((el: HTMLElement) => el.click());
      }

      // Verify navigation started (URL changed or Heading visible)
      // This allows the expect loop to retry clicking if nothing happened
      await Promise.race([
        this.page.waitForURL("**/forgot-password*", { timeout: 2000 }),
        this.forgotPasswordHeading.waitFor({ state: "visible", timeout: 2000 }),
      ]);
    }).toPass({ timeout: 15000 });

    await this.forgotPasswordHeading.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Alias for clickForgotPassword - navigates to forgot password from sign in
   */
  async goToForgotPassword() {
    await this.clickForgotPassword();
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
    // Expand the form after navigation
    await this.expandEmailForm();
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

  /**
   * Wait for form to be fully ready (formReady state)
   * The form has a 350ms delay before setting formReady=true which enables required attributes
   * Uses data-form-ready attribute instead of arbitrary timeout
   */
  async waitForFormReady(timeout = 5000): Promise<boolean> {
    try {
      await this.page.locator('form[data-form-ready="true"]').waitFor({
        state: "attached",
        timeout,
      });
      return true;
    } catch {
      // Fallback: wait the standard delay if attribute not found
      await this.page.waitForTimeout(350);
      return false;
    }
  }

  async expectSignInForm() {
    await expect(this.signInHeading).toBeVisible({ timeout: 10000 });
    // Expand form if collapsed (after navigation from forgot-password, form is collapsed)
    await this.expandEmailForm();
    await expect(this.emailInput).toBeVisible({ timeout: 5000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 5000 });
    await expect(this.signInButton).toBeVisible({ timeout: 5000 });
    await expect(this.googleSignInButton).toBeVisible({ timeout: 5000 });
  }

  async expectSignUpForm() {
    await expect(this.signUpHeading).toBeVisible({ timeout: 10000 });
    // Expand form if collapsed
    await this.expandEmailForm();
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
