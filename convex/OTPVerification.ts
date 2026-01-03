/**
 * OTP Email Verification Provider
 *
 * Sends verification emails using the universal email provider system.
 * Provider rotation and usage tracking are handled automatically.
 *
 * E2E Testing:
 * Emails to @inbox.mailtrap.io are sent normally via the email provider system.
 * When MAILTRAP_MODE=sandbox, emails land in the Mailtrap inbox where
 * E2E tests can fetch them via Mailtrap API to extract the OTP.
 */
import Resend from "@auth/core/providers/resend";
import type { RandomReader } from "@oslojs/crypto/random";
import { generateRandomString } from "@oslojs/crypto/random";
import { sendEmail } from "./email";
import type { ConvexAuthContext } from "./lib/authTypes";

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
 * E2E Testing:
 * All emails are sent normally through the email provider system.
 * When MAILTRAP_MODE=sandbox, emails land in the Mailtrap inbox.
 * E2E tests use Mailtrap API to fetch emails and extract OTP codes.
 */
export const OTPVerification = Resend({
  id: "otp-verification",
  apiKey: "unused", // Required by interface but we use our own email system

  generateVerificationToken() {
    return generateOTP();
  },

  // Convex Auth passes ctx as second param, but @auth/core types don't include it
  // Using type assertion to handle the library integration mismatch
  sendVerificationRequest: (async (
    { identifier: email, token }: { identifier: string; token: string },
    ctx: ConvexAuthContext,
  ) => {
    // Check if user is already verified (e.g., E2E test users)
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (existingUser?.emailVerificationTime) {
      // User already verified - skip sending email
      return;
    }

    // Send verification email through the email provider system
    // In dev/E2E (MAILTRAP_MODE=sandbox), emails go to Mailtrap inbox
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
      throw new Error(`Could not send verification email: ${result.error}`);
    }
  }) as (params: { identifier: string }) => Promise<void>,
});
