/**
 * Email Provider Interface
 *
 * This abstraction allows switching between email services (Resend, SendPulse, etc.)
 * without changing application code.
 */

export interface EmailSendParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface EmailProvider {
  /**
   * Send an email
   */
  send(params: EmailSendParams): Promise<EmailSendResult>;

  /**
   * Validate configuration (API key, from address, etc.)
   */
  isConfigured(): boolean;
}
