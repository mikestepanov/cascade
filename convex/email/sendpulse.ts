/**
 * SendPulse Email Provider Implementation
 *
 * Free tier: 15,000 emails/month (up to 500 subscribers)
 * Docs: https://sendpulse.com/integrations/api/smtp
 */

import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

interface SendPulseTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SendPulseSmtpResponse {
  result: boolean;
  id?: string;
  message?: string;
}

export class SendPulseProvider implements EmailProvider {
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private defaultFrom: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl = "https://api.sendpulse.com";

  constructor() {
    this.clientId = process.env.SENDPULSE_ID || null;
    this.clientSecret = process.env.SENDPULSE_SECRET || null;
    this.defaultFrom = process.env.SENDPULSE_FROM_EMAIL || "Cascade <notifications@cascade.app>";
  }

  isConfigured(): boolean {
    return this.clientId !== null && this.clientSecret !== null;
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(`${this.baseUrl}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`SendPulse auth failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as SendPulseTokenResponse;
    this.accessToken = data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return this.accessToken;
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
        error: "SendPulse provider not configured. Set SENDPULSE_ID and SENDPULSE_SECRET environment variables.",
      };
    }

    try {
      const token = await this.getAccessToken();
      const fromParsed = this.parseFromAddress(params.from || this.defaultFrom);
      const toList = Array.isArray(params.to) ? params.to : [params.to];

      const response = await fetch(`${this.baseUrl}/smtp/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: {
            html: params.html,
            text: params.text || "",
            subject: params.subject,
            from: {
              name: fromParsed.name || "Cascade",
              email: fromParsed.email,
            },
            to: toList.map((email) => ({ email })),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          id: "",
          success: false,
          error: `SendPulse API error: ${response.status} ${errorText}`,
        };
      }

      const result = (await response.json()) as SendPulseSmtpResponse;

      if (result.result) {
        return {
          id: result.id || "",
          success: true,
        };
      } else {
        return {
          id: "",
          success: false,
          error: result.message || "SendPulse send failed",
        };
      }
    } catch (error) {
      return {
        id: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
