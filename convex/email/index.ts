/**
 * Email Service - Main Entry Point
 *
 * This is the only file that application code should import from.
 * To switch email providers, change the provider initialization below.
 */

import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";
import { ResendProvider } from "./resend";
// import { SendPulseProvider } from "./sendpulse";

// ============================================================
// SWITCH PROVIDER HERE
// ============================================================
// Change this line to switch between providers:
const provider: EmailProvider = new ResendProvider();

// For SendPulse (when implemented):
// const provider: EmailProvider = new SendPulseProvider();

// For environment-based switching:
// const provider: EmailProvider =
//   process.env.EMAIL_PROVIDER === "sendpulse"
//     ? new SendPulseProvider()
//     : new ResendProvider();
// ============================================================

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return provider.isConfigured();
}

/**
 * Send an email
 *
 * @example
 * await sendEmail({
 *   to: "user@example.com",
 *   subject: "You were mentioned",
 *   html: "<p>Someone mentioned you!</p>",
 *   text: "Someone mentioned you!"
 * });
 */
export async function sendEmail(params: EmailSendParams): Promise<EmailSendResult> {
  if (!provider.isConfigured()) {
    console.warn("Email provider not configured - email not sent");
    return {
      id: "not-configured",
      success: false,
      error: "Email provider not configured",
    };
  }

  return await provider.send(params);
}

// Re-export types for convenience
export type { EmailSendParams, EmailSendResult };
