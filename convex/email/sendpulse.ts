/**
 * SendPulse Email Provider Implementation (Future)
 *
 * Free tier: 15,000 emails/month
 * Docs: https://sendpulse.com/api
 *
 * To switch to SendPulse:
 * 1. Install: pnpm add sendpulse-api
 * 2. Set env vars: SENDPULSE_ID, SENDPULSE_SECRET, SENDPULSE_FROM_EMAIL
 * 3. Update convex/email/index.ts to use SendPulseProvider
 */

import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

export class SendPulseProvider implements EmailProvider {
  constructor() {
    // TODO: Initialize SendPulse client
    // const apiUserId = process.env.SENDPULSE_ID;
    // const apiSecret = process.env.SENDPULSE_SECRET;
  }

  isConfigured(): boolean {
    // return !!process.env.SENDPULSE_ID && !!process.env.SENDPULSE_SECRET;
    return false;
  }

  async send(_params: EmailSendParams): Promise<EmailSendResult> {
    // TODO: Implement SendPulse API call
    // https://sendpulse.com/integrations/api/smtp

    return {
      id: "",
      success: false,
      error: "SendPulse provider not implemented yet",
    };
  }
}

// Example implementation when ready:
/*
import sendpulse from "sendpulse-api";

export class SendPulseProvider implements EmailProvider {
  private defaultFrom: string;

  constructor() {
    const apiUserId = process.env.SENDPULSE_ID!;
    const apiSecret = process.env.SENDPULSE_SECRET!;
    this.defaultFrom = process.env.SENDPULSE_FROM_EMAIL || "Cascade <notifications@cascade.app>";

    sendpulse.init(apiUserId, apiSecret, "/tmp/sendpulse-token");
  }

  isConfigured(): boolean {
    return !!process.env.SENDPULSE_ID && !!process.env.SENDPULSE_SECRET;
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    return new Promise((resolve) => {
      sendpulse.smtpSendMail((data) => {
        if (data.result) {
          resolve({ id: data.id, success: true });
        } else {
          resolve({ id: "", success: false, error: data.message });
        }
      }, {
        from: { email: this.defaultFrom },
        to: Array.isArray(params.to)
          ? params.to.map(email => ({ email }))
          : [{ email: params.to }],
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
    });
  }
}
*/
