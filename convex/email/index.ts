/**
 * Email Service - Universal Email Wrapper with Provider Rotation
 *
 * ALL emails (notifications, OTP, password reset) go through this system.
 * Automatically rotates between providers to maximize free tier usage.
 *
 * Providers (in priority order):
 * 1. SendPulse - 12,000/month, 400/day (highest capacity)
 * 2. Mailtrap - 4,000/month, 150/day
 * 3. Resend - 3,000/month, 100/day
 *
 * Total free capacity: 19,000 emails/month
 */

import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  isMailtrapProviderConfigured,
  isResendConfigured,
  isSendPulseConfigured,
} from "../lib/env";
import { MailtrapProvider } from "./mailtrap";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";
import { ResendProvider } from "./resend";
import { SendPulseProvider } from "./sendpulse";

// =============================================================================
// Provider Configuration (hardcoded - no DB seed needed)
// =============================================================================

const PROVIDER_CONFIG: Record<
  string,
  {
    freePerMonth: number;
    freePerDay: number;
    priority: number;
    factory: () => EmailProvider;
    isConfigured: () => boolean;
  }
> = {
  sendpulse: {
    freePerMonth: 12000,
    freePerDay: 400,
    priority: 1,
    factory: () => new SendPulseProvider(),
    isConfigured: isSendPulseConfigured,
  },
  mailtrap: {
    freePerMonth: 4000,
    freePerDay: 150,
    priority: 2,
    factory: () => new MailtrapProvider(),
    isConfigured: isMailtrapProviderConfigured,
  },
  resend: {
    freePerMonth: 3000,
    freePerDay: 100,
    priority: 3,
    factory: () => new ResendProvider(),
    isConfigured: isResendConfigured,
  },
};

// Providers sorted by priority (only configured ones)
function getConfiguredProviders(): string[] {
  return Object.entries(PROVIDER_CONFIG)
    .filter(([, config]) => config.isConfigured())
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([name]) => name);
}

// Fallback for backwards compat - use all providers in priority order
const PROVIDERS_BY_PRIORITY = Object.entries(PROVIDER_CONFIG)
  .sort(([, a], [, b]) => a.priority - b.priority)
  .map(([name]) => name);

// =============================================================================
// Provider Selection
// =============================================================================

/**
 * Get current month string (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get current date string (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Select the best provider based on free tier usage (both daily and monthly limits)
 * Only considers configured providers
 */
async function selectProvider(ctx: QueryCtx): Promise<{ name: string; provider: EmailProvider }> {
  const month = getCurrentMonth();
  const date = getCurrentDate();
  const configuredProviders = getConfiguredProviders();

  if (configuredProviders.length === 0) {
    throw new Error("No email providers configured. Set environment variables for at least one provider.");
  }

  // Check each configured provider in priority order
  for (const name of configuredProviders) {
    const config = PROVIDER_CONFIG[name];

    // Get monthly usage
    const monthlyUsage = await ctx.db
      .query("serviceUsage")
      .withIndex("by_provider_month", (q) => q.eq("provider", name).eq("month", month))
      .first();

    // Get daily usage (stored with date as "month" field)
    const dailyUsage = await ctx.db
      .query("serviceUsage")
      .withIndex("by_provider_month", (q) => q.eq("provider", name).eq("month", date))
      .first();

    const monthlyUsed = monthlyUsage?.unitsUsed ?? 0;
    const dailyUsed = dailyUsage?.unitsUsed ?? 0;

    const monthlyRemaining = config.freePerMonth - monthlyUsed;
    const dailyRemaining = config.freePerDay - dailyUsed;

    // Provider is available if both daily AND monthly limits have capacity
    if (monthlyRemaining > 0 && dailyRemaining > 0) {
      return { name, provider: config.factory() };
    }
  }

  // All free tiers exhausted - use first configured provider (will be paid)
  const firstName = configuredProviders[0];
  return { name: firstName, provider: PROVIDER_CONFIG[firstName].factory() };
}

/**
 * Get first configured provider (fallback when no ctx available)
 */
function getFirstProvider(): { name: string; provider: EmailProvider } {
  const configuredProviders = getConfiguredProviders();
  if (configuredProviders.length === 0) {
    throw new Error("No email providers configured. Set environment variables for at least one provider.");
  }
  const name = configuredProviders[0];
  return { name, provider: PROVIDER_CONFIG[name].factory() };
}

// =============================================================================
// Usage Tracking
// =============================================================================

/**
 * Record email usage (both daily and monthly)
 */
async function recordUsage(ctx: MutationCtx, providerName: string, count: number): Promise<void> {
  const month = getCurrentMonth();
  const date = getCurrentDate();
  const config = PROVIDER_CONFIG[providerName];
  if (!config) return;

  // Record monthly usage
  const monthlyExisting = await ctx.db
    .query("serviceUsage")
    .withIndex("by_provider_month", (q) => q.eq("provider", providerName).eq("month", month))
    .first();

  const monthlyUsed = monthlyExisting?.unitsUsed ?? 0;
  const newMonthlyTotal = monthlyUsed + count;
  const paidUnits = Math.max(0, newMonthlyTotal - config.freePerMonth);

  if (monthlyExisting) {
    await ctx.db.patch(monthlyExisting._id, {
      unitsUsed: newMonthlyTotal,
      paidUnitsUsed: paidUnits,
      lastUpdatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("serviceUsage", {
      serviceType: "email",
      provider: providerName,
      month,
      unitsUsed: newMonthlyTotal,
      freeUnitsLimit: config.freePerMonth,
      paidUnitsUsed: paidUnits,
      estimatedCost: 0,
      lastUpdatedAt: Date.now(),
    });
  }

  // Record daily usage (uses date string in month field)
  const dailyExisting = await ctx.db
    .query("serviceUsage")
    .withIndex("by_provider_month", (q) => q.eq("provider", providerName).eq("month", date))
    .first();

  const dailyUsed = dailyExisting?.unitsUsed ?? 0;
  const newDailyTotal = dailyUsed + count;

  if (dailyExisting) {
    await ctx.db.patch(dailyExisting._id, {
      unitsUsed: newDailyTotal,
      lastUpdatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("serviceUsage", {
      serviceType: "email",
      provider: providerName,
      month: date, // Daily tracking uses YYYY-MM-DD
      unitsUsed: newDailyTotal,
      freeUnitsLimit: config.freePerDay,
      paidUnitsUsed: 0, // Daily doesn't track paid (monthly does)
      estimatedCost: 0,
      lastUpdatedAt: Date.now(),
    });
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Send an email using the best available provider
 *
 * @param ctx - Convex context (for usage tracking and provider selection)
 * @param params - Email parameters (to, subject, html, etc.)
 *
 * @example
 * await sendEmail(ctx, {
 *   to: "user@example.com",
 *   subject: "Hello",
 *   html: "<p>Hello!</p>",
 * });
 */
export async function sendEmail(
  ctx: MutationCtx | QueryCtx | null,
  params: EmailSendParams,
): Promise<EmailSendResult & { provider?: string }> {
  // Select provider
  let selected: { name: string; provider: EmailProvider };

  if (ctx) {
    try {
      selected = await selectProvider(ctx as QueryCtx);
    } catch {
      // DB error - fallback to first provider
      selected = getFirstProvider();
    }
  } else {
    // No ctx - use first provider (no rotation)
    selected = getFirstProvider();
  }

  // Send email
  const result = await selected.provider.send(params);

  // Record usage if successful and we have mutation context
  if (ctx && result.success && "scheduler" in ctx) {
    try {
      await recordUsage(ctx as MutationCtx, selected.name, 1);
    } catch {
      // Don't fail send because of usage tracking error
    }
  }

  return { ...result, provider: selected.name };
}

/**
 * Send email using a specific provider (for testing)
 */
export async function sendEmailWithProvider(
  ctx: MutationCtx | null,
  providerName: string,
  params: EmailSendParams,
): Promise<EmailSendResult & { provider: string }> {
  const config = PROVIDER_CONFIG[providerName];
  if (!config) {
    return {
      id: "unknown-provider",
      success: false,
      error: `Unknown provider: ${providerName}`,
      provider: providerName,
    };
  }

  const provider = config.factory();
  const result = await provider.send(params);

  if (ctx && result.success) {
    try {
      await recordUsage(ctx, providerName, 1);
    } catch {
      // Don't fail send because of usage tracking error
    }
  }

  return { ...result, provider: providerName };
}

// Re-export types
export type { EmailSendParams, EmailSendResult };
