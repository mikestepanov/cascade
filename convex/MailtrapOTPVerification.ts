/**
 * Mailtrap OTP Verification Provider
 *
 * Sends verification emails via Mailtrap Sandbox API.
 * Emails land in the Mailtrap inbox where E2E tests can read them.
 */
import Resend from "@auth/core/providers/resend";
import type { RandomReader } from "@oslojs/crypto/random";
import { generateRandomString } from "@oslojs/crypto/random";
import { getMailtrapApiToken, getMailtrapFromEmail, getMailtrapInboxId } from "./lib/env";

/**
 * Send email via Mailtrap Sandbox API
 * Emails sent here appear in the Mailtrap inbox for E2E testing
 */
async function sendViaMailtrap(to: string, subject: string, text: string): Promise<void> {
  const from = getMailtrapFromEmail();
  const inboxId = getMailtrapInboxId();
  const apiToken = getMailtrapApiToken();

  // Parse "Name <email>" format
  const fromMatch = from.match(/^(.+?)\s*<(.+)>$/);
  const fromEmail = fromMatch ? fromMatch[2] : from;
  const fromName = fromMatch ? fromMatch[1] : "Nixelo";

  // Use Mailtrap Sandbox Send API
  const response = await fetch(`https://sandbox.api.mailtrap.io/api/send/${inboxId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      from: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Mailtrap API error: ${response.status} ${errorText}`);
    throw new Error(`Could not send verification email via Mailtrap: ${response.status}`);
  }
}

export const MailtrapOTPVerification = Resend({
  id: "mailtrap-otp-verification",
  apiKey: "mailtrap", // Not used, but required by the provider interface
  // biome-ignore lint/suspicious/useAwait: Required by @auth/core provider interface
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };

    const alphabet = "0123456789";
    const length = 8;
    return generateRandomString(random, alphabet, length);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    await sendViaMailtrap(
      email,
      "Verify your email",
      `Your verification code is: ${token}\n\nThis code expires in 15 minutes.\n\nIf you didn't create an account, you can safely ignore this email.`,
    );
  },
});
