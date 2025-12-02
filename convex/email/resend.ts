/**
 * Resend Email Provider Implementation
 *
 * Free tier: 3,000 emails/month
 * Docs: https://resend.com/docs
 */

import { Resend } from "resend";
import { getResendApiKey, getResendFromEmail } from "../lib/env";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

export class ResendProvider implements EmailProvider {
  private client = new Resend(getResendApiKey());
  private defaultFrom = getResendFromEmail();

  async send(params: EmailSendParams): Promise<EmailSendResult> {
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
