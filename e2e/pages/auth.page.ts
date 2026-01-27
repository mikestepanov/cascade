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
   * Dynamic submit button - returns the visible submit button (Sign in, Create account, or Continue with email)
   * Used by tests that need a generic submit button reference
   */
  get submitButton(): Locator {
    // Return a locator that matches the submit button in any form state
    return this.page.getByRole("button", {
      name: /^(sign in|create account|continue with email)$/i,
    });
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
    this.forgotPasswordLink = page.getByRole("button", { name: /forgot password\?/i });
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
    // Email Verification - Use more robust locators that don't depend strictly on ARIA roles
    // as they might vary between h1/h2 during architecture transitions
    this.verifyHeading = page.getByText(/verify your email/i).first();
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
    await this.page.goto("/signin", { waitUntil: "commit" });
    await this.signInHeading.waitFor({ state: "visible", timeout: 15000 });
    // Expand form using robust click logic
    await this.expandEmailForm();
  }

  /**
   * Navigate to sign up page and expand email form
   */
  async gotoSignUp() {
    await this.page.goto("/signup", { waitUntil: "commit" });
    await this.signUpHeading.waitFor({ state: "visible", timeout: 15000 });
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
   * Uses retry logic to handle React hydration timing issues
   */
  async expandEmailForm() {
    // Wait for hydration first
    await this.waitForHydration();

    // Use retry logic to handle timing issues with form expansion
    await expect(async () => {
      // Check if form is already expanded (either "Sign in" or "Create account" button visible)
      const isSignInExpanded = await this.signInButton.isVisible().catch(() => false);
      const isSignUpExpanded = await this.signUpButton.isVisible().catch(() => false);

      if (isSignInExpanded || isSignUpExpanded) {
        return; // Form is expanded, we're done
      }

      // Click "Continue with email" to expand
      const continueBtn = this.continueWithEmailButton;
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        // Brief wait for state update
        await this.page.waitForTimeout(100);
      }

      // Check expansion again
      const nowSignInVisible = await this.signInButton.isVisible().catch(() => false);
      const nowSignUpVisible = await this.signUpButton.isVisible().catch(() => false);
      expect(nowSignInVisible || nowSignUpVisible).toBe(true);
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

    // Also wait for form-ready state
    await this.waitForFormReady();
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

    // Ensure form is ready before clicking submit
    await this.waitForFormReady();

    // Wait for button to be enabled
    await expect(this.signUpButton).toBeEnabled({ timeout: 5000 });

    // Click the submit button
    await this.signUpButton.click();

    // Wait for form submission to complete (verification form or error)
    await this.page.waitForTimeout(3000);
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

    // Click with force to bypass actionability checks (button may be styled as link)
    await this.forgotPasswordLink.click({ force: true });

    // Wait for navigation to complete
    await this.page.waitForURL("**/forgot-password*", { timeout: 15000 });
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
    // Wait for verification to process
    await this.page.waitForTimeout(1000);
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
   * Wait for component to be hydrated
   */
  async waitForHydration(timeout = 5000) {
    await this.page.locator('form[data-hydrated="true"]').waitFor({
      state: "attached",
      timeout,
    });
  }

  /**
   * Wait for form to be fully ready (formReady state)
   * The form has a 350ms delay before setting formReady=true which enables required attributes
   * Uses data-form-ready attribute instead of arbitrary timeout
   * This is a best-effort wait - it won't throw if the form doesn't have this attribute
   */
  async waitForFormReady(timeout = 5000) {
    try {
      await this.page.locator('form[data-form-ready="true"]').waitFor({
        state: "attached",
        timeout,
      });
    } catch {
      // Form might not have data-form-ready attribute (e.g., forgot password page)
      // Just wait a brief moment for stability
      await this.page.waitForTimeout(300);
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
    // Give React state a moment to switch from SignUpForm to EmailVerificationForm
    await this.page.waitForTimeout(1000);

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
