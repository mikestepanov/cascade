/**
 * Environment variable utilities
 *
 * Centralizes all env var access. No more scattered process.env usage.
 * Required vars throw early if missing. Optional vars return null.
 */

// ===========================================
// Core utilities
// ===========================================

/**
 * Get a required environment variable. Throws if not defined.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Get an optional environment variable. Returns undefined if not defined.
 */
export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

// ===========================================
// App URLs
// ===========================================

/** Site URL - required for OAuth, emails, invites */
export function getSiteUrl(): string {
  return requireEnv("SITE_URL");
}

// ===========================================
// Google OAuth (for Calendar integration)
// ===========================================

export function getGoogleClientId(): string | undefined {
  return optionalEnv("GOOGLE_CLIENT_ID");
}

export function getGoogleClientSecret(): string | undefined {
  return optionalEnv("GOOGLE_CLIENT_SECRET");
}

export function isGoogleOAuthConfigured(): boolean {
  return !!getGoogleClientId() && !!getGoogleClientSecret();
}

// ===========================================
// Bot Service (meeting recording)
// ===========================================

export function getBotServiceUrl(): string | undefined {
  return optionalEnv("BOT_SERVICE_URL");
}

export function getBotServiceApiKey(): string | undefined {
  return optionalEnv("BOT_SERVICE_API_KEY");
}

export function isBotServiceConfigured(): boolean {
  return !!getBotServiceUrl() && !!getBotServiceApiKey();
}

// ===========================================
// AI - Anthropic (chat)
// ===========================================

export function getAnthropicApiKey(): string | undefined {
  return optionalEnv("ANTHROPIC_API_KEY");
}

export function getAnthropicModel(): string {
  return optionalEnv("ANTHROPIC_MODEL") || "claude-sonnet-4-20250514";
}

export function isAnthropicConfigured(): boolean {
  return !!getAnthropicApiKey();
}

// ===========================================
// AI - Voyage (embeddings)
// ===========================================

export function getVoyageApiKey(): string | undefined {
  return optionalEnv("VOYAGE_API_KEY");
}

export function isVoyageConfigured(): boolean {
  return !!getVoyageApiKey();
}

// ===========================================
// Email - Resend
// ===========================================

export function getResendApiKey(): string | undefined {
  return optionalEnv("RESEND_API_KEY");
}

export function getResendFromEmail(): string {
  return optionalEnv("RESEND_FROM_EMAIL") || "Nixelo <notifications@nixelo.app>";
}

export function isResendConfigured(): boolean {
  return !!getResendApiKey();
}

// ===========================================
// Email - SendPulse
// ===========================================

export function getSendPulseId(): string | undefined {
  return optionalEnv("SENDPULSE_ID");
}

export function getSendPulseSecret(): string | undefined {
  return optionalEnv("SENDPULSE_SECRET");
}

export function getSendPulseFromEmail(): string {
  return optionalEnv("SENDPULSE_FROM_EMAIL") || "Nixelo <notifications@nixelo.app>";
}

export function isSendPulseConfigured(): boolean {
  return !!getSendPulseId() && !!getSendPulseSecret();
}

// ===========================================
// Email - SendGrid
// ===========================================

export function getSendGridApiKey(): string | undefined {
  return optionalEnv("SENDGRID_API_KEY");
}

export function getSendGridFromEmail(): string {
  return optionalEnv("SENDGRID_FROM_EMAIL") || "Nixelo <notifications@nixelo.app>";
}

export function isSendGridConfigured(): boolean {
  return !!getSendGridApiKey();
}

// ===========================================
// Email - Mailgun
// ===========================================

export function getMailgunApiKey(): string | undefined {
  return optionalEnv("MAILGUN_API_KEY");
}

export function getMailgunDomain(): string | undefined {
  return optionalEnv("MAILGUN_DOMAIN");
}

export function getMailgunFromEmail(): string {
  return optionalEnv("MAILGUN_FROM_EMAIL") || "Nixelo <notifications@nixelo.app>";
}

export function getMailgunRegion(): "us" | "eu" {
  return (optionalEnv("MAILGUN_REGION") || "us") as "us" | "eu";
}

export function isMailgunConfigured(): boolean {
  return !!getMailgunApiKey() && !!getMailgunDomain();
}
