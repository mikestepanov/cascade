/**
 * OTP Email Verification Provider
 *
 * Sends verification emails using the universal email provider system.
 * Provider rotation and usage tracking are handled automatically.
 *
 * E2E Test Mode:
 * For emails ending with @inbox.mailtrap.io, uses a fixed OTP code (12345678)
 * and skips actual email sending. This enables E2E tests without requiring
 * working email provider credentials.
 */
import Resend from "@auth/core/providers/resend";
import type { RandomReader } from "@oslojs/crypto/random";
import { generateRandomString } from "@oslojs/crypto/random";
import { sendEmail } from "./email";
import { internal } from "./_generated/api";

// Fixed OTP for E2E testing (used for @inbox.mailtrap.io emails)
const E2E_TEST_OTP = "12345678";

/**
 * Check if email is for E2E testing
 */
function isE2ETestEmail(email: string): boolean {
  return email.endsWith("@inbox.mailtrap.io");
}

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
 *
 * E2E Test Mode:
 * For emails ending with @inbox.mailtrap.io, uses a fixed OTP code (12345678)
 * and skips actual email sending. This enables E2E tests without requiring
 * working email provider credentials.
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
    // Check if this is an E2E test email - store OTP in DB and skip email sending
    if (isE2ETestEmail(email)) {
      console.log(`[E2E TEST] Email verification OTP for ${email}: ${token}`);

      // Store OTP in database for E2E test retrieval via HTTP endpoint
      try {
        await ctx.scheduler.runAfter(0, internal.e2e.storeTestOTP, {
          email,
          otp: token,
        });
        console.log(`[E2E TEST] OTP stored in database, retrieve via /e2e/otp?email=${email}`);
      } catch (e) {
        console.error(`[E2E TEST] Failed to store OTP:`, e);
      }

      return; // Skip email sending for test emails
    }

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
