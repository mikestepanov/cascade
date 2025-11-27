/**
 * SendGrid Email Provider Implementation
 *
 * Free tier: 100 emails/day (~3,000/month)
 * Docs: https://docs.sendgrid.com/
 */

import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

interface SendGridResponse {
  // SendGrid returns 202 with no body on success
  // On error, returns { errors: [{ message: string, field?: string }] }
  errors?: Array<{ message: string; field?: string }>;
}

export class SendGridProvider implements EmailProvider {
  private apiKey: string | null = null;
  private defaultFrom: string;
  private baseUrl = "https://api.sendgrid.com/v3";

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || null;
    this.defaultFrom = process.env.SENDGRID_FROM_EMAIL || "Cascade <notifications@cascade.app>";
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
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
        error: "SendGrid provider not configured. Set SENDGRID_API_KEY environment variable.",
      };
    }

    try {
      const fromParsed = this.parseFromAddress(params.from || this.defaultFrom);
      const toList = Array.isArray(params.to) ? params.to : [params.to];

      const requestBody: {
        personalizations: Array<{ to: Array<{ email: string }> }>;
        from: { email: string; name?: string };
        subject: string;
        content: Array<{ type: string; value: string }>;
        reply_to?: { email: string };
      } = {
        personalizations: [
          {
            to: toList.map((email) => ({ email })),
          },
        ],
        from: fromParsed,
        subject: params.subject,
        content: [
          {
            type: "text/html",
            value: params.html,
          },
        ],
      };

      // Add plain text version if provided
      if (params.text) {
        requestBody.content.unshift({
          type: "text/plain",
          value: params.text,
        });
      }

      // Add reply-to if provided
      if (params.replyTo) {
        requestBody.reply_to = { email: params.replyTo };
      }

      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // SendGrid returns 202 Accepted on success with no body
      if (response.status === 202) {
        // Extract message ID from headers
        const messageId = response.headers.get("X-Message-Id") || "";
        return {
          id: messageId,
          success: true,
        };
      }

      // Handle errors
      const errorBody = (await response.json()) as SendGridResponse;
      const errorMessage = errorBody.errors?.map((e) => e.message).join(", ") || "Unknown error";

      return {
        id: "",
        success: false,
        error: `SendGrid API error: ${response.status} - ${errorMessage}`,
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
