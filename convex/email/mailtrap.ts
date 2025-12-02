/**
 * Mailtrap Email Provider Implementation
 *
 * Uses Mailtrap Sandbox API for sending emails.
 * Emails land in the Mailtrap inbox where E2E tests can read them.
 *
 * Free tier: 1,000 emails/month
 * Docs: https://api-docs.mailtrap.io/docs/mailtrap-api-docs/
 */

import { getMailtrapApiToken, getMailtrapFromEmail, getMailtrapInboxId } from "../lib/env";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

interface MailtrapSendResponse {
  success: boolean;
  message_ids?: string[];
  errors?: string[];
}

export class MailtrapProvider implements EmailProvider {
  private apiToken: string | undefined;
  private inboxId: string | undefined;
  private defaultFrom: string | undefined;

  constructor() {
    try {
      this.apiToken = getMailtrapApiToken();
      this.inboxId = getMailtrapInboxId();
      this.defaultFrom = getMailtrapFromEmail();
    } catch {
      // Not configured - isConfigured() will return false
    }
  }

  isConfigured(): boolean {
    return !!this.apiToken && !!this.inboxId;
  }

  private parseFromAddress(from: string): { email: string; name?: string } {
    // Parse "Name <email@example.com>" format
    const match = from.match(/^(.+?)\s*<(.+)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: from };
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    if (!this.isConfigured()) {
      return {
        id: "not-configured",
        success: false,
        error:
          "Mailtrap provider not configured. Set MAILTRAP_API_TOKEN and MAILTRAP_INBOX_ID environment variables.",
      };
    }

    try {
      const fromParsed = this.parseFromAddress(
        params.from || this.defaultFrom || "Nixelo <noreply@nixelo.com>",
      );
      const toList = Array.isArray(params.to) ? params.to : [params.to];

      // Use Mailtrap Sandbox Send API
      const response = await fetch(`https://sandbox.api.mailtrap.io/api/send/${this.inboxId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          from: {
            email: fromParsed.email,
            name: fromParsed.name || "Nixelo",
          },
          to: toList.map((email) => ({ email })),
          subject: params.subject,
          html: params.html,
          text: params.text || "",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          id: "",
          success: false,
          error: `Mailtrap API error: ${response.status} ${errorText}`,
        };
      }

      const result = (await response.json()) as MailtrapSendResponse;

      if (result.success) {
        return {
          id: result.message_ids?.[0] || "",
          success: true,
        };
      }
      return {
        id: "",
        success: false,
        error: result.errors?.join(", ") || "Mailtrap send failed",
      };
    } catch (error) {
      return {
        id: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
