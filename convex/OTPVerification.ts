/**
 * OTP Email Verification Provider
 *
 * Sends verification emails using the universal email provider system.
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
 * OTP Verification Provider for email verification during signup
 *
 * Uses the universal sendEmail() which handles:
 * - Provider rotation (SendPulse, Mailtrap, Resend, Mailgun)
 * - Free tier management (daily + monthly limits)
 * - Usage tracking
 */
export const OTPVerification = Resend({
  id: "otp-verification",
  apiKey: "unused", // Required by interface but we use our own email system
  // biome-ignore lint/suspicious/useAwait: Required by @auth/core provider interface
  async generateVerificationToken() {
    return generateOTP();
  },
  // @ts-expect-error - ctx IS passed at runtime by @convex-dev/auth (see signIn.ts:92-95)
  // but types are incomplete. Convex issue: https://github.com/get-convex/convex-auth
  async sendVerificationRequest({ identifier: email, token }, ctx) {
    const result = await sendEmail(ctx, {
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Verify your email</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; font-family: monospace;">${token}</h1>
        <p>This code expires in 15 minutes.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
      text: `Your verification code is: ${token}\n\nThis code expires in 15 minutes.\n\nIf you didn't create an account, you can safely ignore this email.`,
    });

    if (!result.success) {
      console.error(`Failed to send verification email: ${result.error}`);
      throw new Error("Could not send verification email");
    }
  },
});
