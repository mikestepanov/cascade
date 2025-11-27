import type { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for authentication flows
 */
export class AuthPage {
  readonly page: Page;

  // Sign In / Sign Up form
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly toggleFlowButton: Locator;
  readonly forgotPasswordButton: Locator;
  readonly googleSignInButton: Locator;

  // Forgot Password form
  readonly resetHeading: Locator;
  readonly sendResetCodeButton: Locator;
  readonly backToSignInButton: Locator;

  // Reset Password form (step 2)
  readonly codeInput: Locator;
  readonly newPasswordInput: Locator;
  readonly resetPasswordButton: Locator;
  readonly resendCodeButton: Locator;

  // Email Verification form
  readonly verifyHeading: Locator;
  readonly verifyCodeInput: Locator;
  readonly verifyEmailButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sign In / Sign Up
    this.emailInput = page.getByPlaceholder("Email");
    this.passwordInput = page.getByPlaceholder("Password");
    this.submitButton = page.getByRole("button", { name: /^sign (in|up)$/i });
    this.toggleFlowButton = page.getByRole("button", { name: /sign (in|up) instead/i });
    this.forgotPasswordButton = page.getByRole("button", { name: /forgot password/i });
    this.googleSignInButton = page.getByRole("button", { name: /sign in with google/i });

    // Forgot Password
    this.resetHeading = page.getByRole("heading", { name: /reset your password/i });
    this.sendResetCodeButton = page.getByRole("button", { name: /send reset code/i });
    this.backToSignInButton = page.getByRole("button", { name: /back to sign in/i });

    // Reset Password (step 2)
    this.codeInput = page.getByPlaceholder("8-digit code");
    this.newPasswordInput = page.getByPlaceholder("New password");
    this.resetPasswordButton = page.getByRole("button", { name: /reset password/i });
    this.resendCodeButton = page.getByRole("button", { name: /didn't receive a code/i });

    // Email Verification
    this.verifyHeading = page.getByRole("heading", { name: /verify your email/i });
    this.verifyCodeInput = page.getByPlaceholder(/enter.*code|8-digit code/i);
    this.verifyEmailButton = page.getByRole("button", { name: /verify email/i });
  }

  async goto() {
    await this.page.goto("/");
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async signUp(email: string, password: string) {
    await this.toggleFlowButton.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async goToForgotPassword() {
    await this.forgotPasswordButton.click();
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

  async verifyEmail(code: string) {
    await this.verifyCodeInput.fill(code);
    await this.verifyEmailButton.click();
  }
}
