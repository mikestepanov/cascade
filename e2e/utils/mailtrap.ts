/**
 * Mailtrap API helper for E2E testing
 *
 * Used to fetch verification emails and extract OTP codes
 * during automated signup testing.
 */

const MAILTRAP_API_TOKEN = process.env.MAILTRAP_API_TOKEN;
const MAILTRAP_ACCOUNT_ID = process.env.MAILTRAP_ACCOUNT_ID;
const MAILTRAP_INBOX_ID = process.env.MAILTRAP_INBOX_ID;

const MAILTRAP_API_BASE = "https://mailtrap.io/api";

interface MailtrapMessage {
  id: number;
  inbox_id: number;
  subject: string;
  sent_at: string;
  from_email: string;
  from_name: string;
  to_email: string;
  to_name: string;
  html_body: string;
  text_body: string;
  created_at: string;
}

/**
 * Check if Mailtrap is configured
 */
export function isMailtrapConfigured(): boolean {
  return !!(MAILTRAP_API_TOKEN && MAILTRAP_ACCOUNT_ID && MAILTRAP_INBOX_ID);
}

/**
 * Fetch messages from Mailtrap inbox
 */
async function fetchMessages(): Promise<MailtrapMessage[]> {
  if (!isMailtrapConfigured()) {
    throw new Error(
      "Mailtrap not configured. Set MAILTRAP_API_TOKEN, MAILTRAP_ACCOUNT_ID, MAILTRAP_INBOX_ID",
    );
  }

  const url = `${MAILTRAP_API_BASE}/accounts/${MAILTRAP_ACCOUNT_ID}/inboxes/${MAILTRAP_INBOX_ID}/messages`;

  const response = await fetch(url, {
    headers: {
      "Api-Token": MAILTRAP_API_TOKEN!,
    },
  });

  if (!response.ok) {
    throw new Error(`Mailtrap API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get the text body of a specific message
 */
async function getMessageText(messageId: number): Promise<string> {
  const url = `${MAILTRAP_API_BASE}/accounts/${MAILTRAP_ACCOUNT_ID}/inboxes/${MAILTRAP_INBOX_ID}/messages/${messageId}/body.txt`;

  const response = await fetch(url, {
    headers: {
      "Api-Token": MAILTRAP_API_TOKEN!,
    },
  });

  if (!response.ok) {
    throw new Error(`Mailtrap API error: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Wait for a verification email to arrive for a specific email address
 * Returns the OTP code from the email
 */
export async function waitForVerificationEmail(
  toEmail: string,
  options: { timeout?: number; pollInterval?: number } = {},
): Promise<string> {
  const { timeout = 30000, pollInterval = 2000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const messages = await fetchMessages();

    // Find verification email for this recipient
    const verificationEmail = messages.find(
      (msg) =>
        msg.to_email.toLowerCase() === toEmail.toLowerCase() &&
        (msg.subject.toLowerCase().includes("verify") ||
          msg.subject.toLowerCase().includes("verification") ||
          msg.subject.toLowerCase().includes("code")),
    );

    if (verificationEmail) {
      // Get the text body
      const textBody = await getMessageText(verificationEmail.id);

      // Extract 8-digit OTP code
      const otpMatch = textBody.match(/\b(\d{8})\b/);
      if (otpMatch) {
        return otpMatch[1];
      }

      // Try alternative patterns
      const codeMatch = textBody.match(/code[:\s]+(\d{6,8})/i);
      if (codeMatch) {
        return codeMatch[1];
      }

      throw new Error(
        `Verification email found but could not extract OTP code. Body: ${textBody.substring(0, 200)}`,
      );
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Timeout waiting for verification email to ${toEmail}`);
}

/**
 * Delete all messages in the inbox (cleanup)
 */
export async function clearInbox(): Promise<void> {
  if (!isMailtrapConfigured()) {
    return;
  }

  const url = `${MAILTRAP_API_BASE}/accounts/${MAILTRAP_ACCOUNT_ID}/inboxes/${MAILTRAP_INBOX_ID}/clean`;

  await fetch(url, {
    method: "PATCH",
    headers: {
      "Api-Token": MAILTRAP_API_TOKEN!,
    },
  });
}

/**
 * Get the Mailtrap inbox email address for testing
 * Format: anything@inbox.mailtrap.io routes to your inbox
 */
export function getTestEmailAddress(prefix = "e2e-test"): string {
  const timestamp = Date.now();
  // Use inbox-specific email address
  return `${prefix}-${timestamp}@inbox.mailtrap.io`;
}
