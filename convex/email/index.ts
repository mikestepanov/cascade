/**
 * Email Service - Main Entry Point with Provider Rotation
 *
 * Automatically selects the best available email provider based on free tier usage.
 * Integrates with Convex serviceRotation for usage tracking.
 *
 * Providers (in priority order):
 * 1. Resend - 3,000 emails/month free
 * 2. SendPulse - 15,000 emails/month free (up to 500 subscribers)
 * 3. Mailgun - 1,000 emails/month on flex plan
 * 4. SendGrid - 100/day (~3,000/month) free
 *
 * Total free capacity: 22,000 emails/month
 */

import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MailgunProvider } from "./mailgun";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";
import { ResendProvider } from "./resend";
import { SendGridProvider } from "./sendgrid";
import { SendPulseProvider } from "./sendpulse";

// Provider registry
const providers: Record<string, () => EmailProvider> = {
  resend: () => new ResendProvider(),
  sendpulse: () => new SendPulseProvider(),
  mailgun: () => new MailgunProvider(),
  sendgrid: () => new SendGridProvider(),
};

// Priority order (used when Convex rotation is unavailable)
// Total free capacity: 22,000 emails/month (3000 + 15000 + 1000 + 3000)
const PROVIDER_PRIORITY = ["resend", "sendpulse", "mailgun", "sendgrid"];

/**
 * Get a provider instance by name
 */
function getProvider(name: string): EmailProvider | null {
  const factory = providers[name.toLowerCase()];
  return factory ? factory() : null;
}

/**
 * Get the first configured provider (fallback)
 */
function getFirstConfiguredProvider(): { name: string; provider: EmailProvider } | null {
  for (const name of PROVIDER_PRIORITY) {
    const provider = getProvider(name);
    if (provider?.isConfigured()) {
      return { name, provider };
    }
  }
  return null;
}

/**
 * Check if any email provider is configured
 */
export function isEmailConfigured(): boolean {
  return getFirstConfiguredProvider() !== null;
}

// Types for provider selection
interface ServiceProviderConfig {
  provider: string;
  isConfigured: boolean;
  freeUnitsType: string;
  freeUnitsPerMonth: number;
  oneTimeUnitsRemaining?: number;
  costPerUnit: number;
  priority: number;
}

interface ProviderSelection {
  name: string;
  provider: EmailProvider;
}

/**
 * Calculate remaining free capacity for a provider
 */
function calculateFreeCapacity(config: ServiceProviderConfig, unitsUsed: number): number {
  if (config.freeUnitsType === "one_time") {
    return config.oneTimeUnitsRemaining ?? 0;
  }
  return Math.max(0, config.freeUnitsPerMonth - unitsUsed);
}

/**
 * Find a provider with free capacity from sorted configs
 */
async function findProviderWithFreeCapacity(
  ctx: QueryCtx,
  configs: ServiceProviderConfig[],
  month: string,
): Promise<ProviderSelection | null> {
  for (const config of configs) {
    if (!config.isConfigured) continue;

    const usage = await ctx.db
      .query("serviceUsage")
      .withIndex("by_provider_month", (q) => q.eq("provider", config.provider).eq("month", month))
      .first();

    const freeRemaining = calculateFreeCapacity(config, usage?.unitsUsed ?? 0);

    if (freeRemaining > 0) {
      const provider = getProvider(config.provider);
      if (provider?.isConfigured()) {
        return { name: config.provider, provider };
      }
    }
  }
  return null;
}

/**
 * Find the cheapest configured provider
 */
function findCheapestProvider(configs: ServiceProviderConfig[]): ProviderSelection | null {
  const sorted = configs
    .filter((c) => c.isConfigured)
    .sort((a, b) => a.costPerUnit - b.costPerUnit);

  for (const config of sorted) {
    const provider = getProvider(config.provider);
    if (provider?.isConfigured()) {
      return { name: config.provider, provider };
    }
  }
  return null;
}

/**
 * Select the best provider from database configuration
 */
async function selectProviderFromDatabase(ctx: QueryCtx): Promise<ProviderSelection | null> {
  const configs = await ctx.db
    .query("serviceProviders")
    .withIndex("by_service_enabled", (q) => q.eq("serviceType", "email").eq("isEnabled", true))
    .collect();

  // Sort by priority
  configs.sort((a, b) => a.priority - b.priority);

  const month = getCurrentMonth();

  // Try to find provider with free capacity
  const freeProvider = await findProviderWithFreeCapacity(ctx, configs, month);
  if (freeProvider) return freeProvider;

  // Fall back to cheapest provider
  return findCheapestProvider(configs);
}

/**
 * Send an email using the best available provider
 *
 * When called from a Convex function, pass the ctx to enable usage tracking.
 * When called outside Convex, it will use local fallback logic.
 *
 * @example
 * // From a Convex mutation/action
 * await sendEmail(ctx, {
 *   to: "user@example.com",
 *   subject: "You were mentioned",
 *   html: "<p>Someone mentioned you!</p>",
 * });
 *
 * // From outside Convex (no usage tracking)
 * await sendEmail(null, { ... });
 */
export async function sendEmail(
  ctx: MutationCtx | QueryCtx | null,
  params: EmailSendParams,
): Promise<EmailSendResult & { provider?: string }> {
  // Select provider: try database config first, then fallback
  let selectedProvider: ProviderSelection | null = null;

  if (ctx) {
    try {
      selectedProvider = await selectProviderFromDatabase(ctx as QueryCtx);
    } catch (_error) {
      // Database error, fall through to fallback
    }
  }

  // Fallback to first configured provider
  if (!selectedProvider) {
    selectedProvider = getFirstConfiguredProvider();
  }

  if (!selectedProvider) {
    return {
      id: "not-configured",
      success: false,
      error: "No email provider configured",
    };
  }

  // Send email
  const result = await selectedProvider.provider.send(params);

  // Record usage if mutation context and send was successful
  if (ctx && result.success && "scheduler" in ctx) {
    try {
      await recordEmailUsage(ctx as MutationCtx, selectedProvider.name, 1);
    } catch (_error) {
      // Don't fail the send just because usage tracking failed
    }
  }

  return {
    ...result,
    provider: selectedProvider.name,
  };
}

/**
 * Send email using a specific provider (for testing or manual override)
 */
export async function sendEmailWithProvider(
  ctx: MutationCtx | null,
  providerName: string,
  params: EmailSendParams,
): Promise<EmailSendResult & { provider: string }> {
  const provider = getProvider(providerName);

  if (!provider) {
    return {
      id: "unknown-provider",
      success: false,
      error: `Unknown provider: ${providerName}`,
      provider: providerName,
    };
  }

  if (!provider.isConfigured()) {
    return {
      id: "not-configured",
      success: false,
      error: `Provider ${providerName} is not configured`,
      provider: providerName,
    };
  }

  const result = await provider.send(params);

  // Record usage
  if (ctx && result.success) {
    try {
      await recordEmailUsage(ctx, providerName, 1);
    } catch (_error) {
      // Don't fail the send just because usage tracking failed
    }
  }

  return {
    ...result,
    provider: providerName,
  };
}

/**
 * Record email usage to Convex
 */
async function recordEmailUsage(
  ctx: MutationCtx,
  providerName: string,
  emailCount: number,
): Promise<void> {
  const month = getCurrentMonth();

  // Get provider config
  const providerConfig = await ctx.db
    .query("serviceProviders")
    .withIndex("by_provider", (q) => q.eq("provider", providerName))
    .first();

  if (!providerConfig) {
    return;
  }

  // Get or create usage record
  const existingUsage = await ctx.db
    .query("serviceUsage")
    .withIndex("by_provider_month", (q) => q.eq("provider", providerName).eq("month", month))
    .first();

  const currentUnitsUsed = existingUsage?.unitsUsed ?? 0;
  const newTotalUnits = currentUnitsUsed + emailCount;

  // Calculate free vs paid
  const freeLimit =
    providerConfig.freeUnitsType === "one_time"
      ? (providerConfig.oneTimeUnitsRemaining ?? 0)
      : providerConfig.freeUnitsPerMonth;

  const paidUnits = Math.max(0, newTotalUnits - freeLimit);
  const estimatedCost = paidUnits * providerConfig.costPerUnit;

  if (existingUsage) {
    await ctx.db.patch(existingUsage._id, {
      unitsUsed: newTotalUnits,
      paidUnitsUsed: paidUnits,
      estimatedCost,
      lastUpdatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("serviceUsage", {
      serviceType: "email",
      provider: providerName,
      month,
      unitsUsed: newTotalUnits,
      freeUnitsLimit: freeLimit,
      paidUnitsUsed: paidUnits,
      estimatedCost,
      lastUpdatedAt: Date.now(),
    });
  }

  // Update one-time credits if applicable
  if (providerConfig.freeUnitsType === "one_time" && providerConfig.oneTimeUnitsRemaining) {
    const newRemaining = Math.max(0, providerConfig.oneTimeUnitsRemaining - emailCount);
    await ctx.db.patch(providerConfig._id, {
      oneTimeUnitsRemaining: newRemaining,
      updatedAt: Date.now(),
    });
  }
}

/**
 * Get current month string (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Re-export types for convenience
export type { EmailSendParams, EmailSendResult };
