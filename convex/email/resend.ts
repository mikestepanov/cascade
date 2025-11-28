/**
 * Resend Email Provider Implementation
 *
 * Free tier: 3,000 emails/month
 * Docs: https://resend.com/docs
 */

import { Resend } from "resend";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

export class ResendProvider implements EmailProvider {
  private client: Resend | null = null;
  private defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.defaultFrom = process.env.RESEND_FROM_EMAIL || "Nixelo <notifications@nixelo.app>";

    if (apiKey) {
      this.client = new Resend(apiKey);
    }
  }

  isConfigured(): boolean {
    return this.client !== null && !!process.env.RESEND_API_KEY;
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    if (!this.client) {
      return {
        id: "not-configured",
        success: false,
        error: "Email provider not configured. Set RESEND_API_KEY environment variable.",
      };
    }

    try {
      const result = await this.client.emails.send({
        from: params.from || this.defaultFrom,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo,
      });

      if (result.error) {
        return {
          id: "",
          success: false,
          error: result.error.message,
        };
      }

      return {
        id: result.data?.id || "",
        success: true,
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
