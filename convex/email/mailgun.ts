/**
 * Mailgun Email Provider Implementation
 *
 * Free tier: 1,000 emails/month (on flex plan)
 * Docs: https://documentation.mailgun.com/en/latest/
 */

import {
  getMailgunApiKey,
  getMailgunDomain,
  getMailgunFromEmail,
  getMailgunRegion,
} from "../lib/env";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

interface MailgunResponse {
  id: string;
  message: string;
}

export class MailgunProvider implements EmailProvider {
  private apiKey = getMailgunApiKey();
  private domain = getMailgunDomain();
  private defaultFrom = getMailgunFromEmail();
  private region = getMailgunRegion();

  isConfigured(): boolean {
    return !!this.apiKey && !!this.domain;
  }

  private getBaseUrl(): string {
    return this.region === "eu"
      ? `https://api.eu.mailgun.net/v3/${this.domain}`
      : `https://api.mailgun.net/v3/${this.domain}`;
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    if (!this.isConfigured()) {
      return {
        id: "not-configured",
        success: false,
        error:
          "Mailgun provider not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.",
      };
    }

    try {
      const toList = Array.isArray(params.to) ? params.to : [params.to];

      const formData = new FormData();
      formData.append("from", params.from || this.defaultFrom);
      formData.append("to", toList.join(", "));
      formData.append("subject", params.subject);
      formData.append("html", params.html);
      if (params.text) {
        formData.append("text", params.text);
      }
      if (params.replyTo) {
        formData.append("h:Reply-To", params.replyTo);
      }

      const response = await fetch(`${this.getBaseUrl()}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${this.apiKey}`)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          id: "",
          success: false,
          error: `Mailgun API error: ${response.status} ${errorText}`,
        };
      }

      const result = (await response.json()) as MailgunResponse;

      return {
        id: result.id || "",
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
