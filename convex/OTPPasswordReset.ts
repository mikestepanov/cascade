/**
 * OTP Password Reset Provider
 *
 * Sends password reset emails using the universal email provider system.
 * Provider rotation and usage tracking are handled automatically.
 */
import Resend from "@auth/core/providers/resend";
import type { RandomReader } from "@oslojs/crypto/random";
import { generateRandomString } from "@oslojs/crypto/random";
import { sendEmail } from "./email";

/**
 * Generate an 8-digit OTP code
 */
function generateOTP(): string {
  const random: RandomReader = {
    read(bytes: Uint8Array) {
      crypto.getRandomValues(bytes);
    },
  };
  return generateRandomString(random, "0123456789", 8);
}

/**
 * OTP Password Reset Provider
 *
 * Uses the universal sendEmail() which handles:
 * - Provider rotation (SendPulse, Mailtrap, Resend, Mailgun)
 * - Free tier management (daily + monthly limits)
 * - Usage tracking
 */
export const OTPPasswordReset = Resend({
  id: "otp-password-reset",
  apiKey: "unused", // Required by interface but we use our own email system

  generateVerificationToken() {
    return generateOTP();
  },

  // but types are incomplete. Convex issue: https://github.com/get-convex/convex-auth
  // @ts-expect-error Types are incomplete. Convex issue: https://github.com/get-convex/convex-auth
  async sendVerificationRequest(
    { identifier: email, token }: { identifier: string; token: string },
    ctx: any,
  ) {
    const result = await sendEmail(ctx, {
      to: email,
      subject: "Reset your password",
      html: `
        <h2>Reset your password</h2>
        <p>Your password reset code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; font-family: monospace;">${token}</h1>
        <p>This code expires in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      text: `Your password reset code is: ${token}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
    });

    if (!result.success) {
      throw new Error(`Could not send password reset email: ${result.error}`);
    }
  },
});
