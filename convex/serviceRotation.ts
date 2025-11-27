/**
 * Service Rotation - Free Tier Management
 *
 * Automatically rotates between service providers to maximize free tier usage.
 * Supports: transcription, email, sms, ai
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Service types
export type ServiceType = "transcription" | "email" | "sms" | "ai";

// Get current month string
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================
// Queries
// ============================================

/**
 * Get the best available provider for a service type
 * Prioritizes providers with remaining free tier capacity
 */
export const selectProvider = query({
  args: {
    serviceType: v.union(
      v.literal("transcription"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("ai")
    ),
    unitsNeeded: v.optional(v.number()), // Estimate of units needed (optional)
  },
  handler: async (ctx, args) => {
    const month = getCurrentMonth();

    // Get all enabled providers for this service type, ordered by priority
    const providers = await ctx.db
      .query("serviceProviders")
      .withIndex("by_service_enabled", (q) =>
        q.eq("serviceType", args.serviceType).eq("isEnabled", true)
      )
      .collect();

    // Sort by priority
    providers.sort((a, b) => a.priority - b.priority);

    // Get usage for each provider this month
    const providersWithUsage = await Promise.all(
      providers.map(async (provider) => {
        const usage = await ctx.db
          .query("serviceUsage")
          .withIndex("by_provider_month", (q) =>
            q.eq("provider", provider.provider).eq("month", month)
          )
          .first();

        const unitsUsed = usage?.unitsUsed ?? 0;
        let freeUnitsRemaining: number;

        if (provider.freeUnitsType === "one_time") {
          // One-time credits
          freeUnitsRemaining = provider.oneTimeUnitsRemaining ?? 0;
        } else {
          // Monthly/yearly resets
          freeUnitsRemaining = Math.max(0, provider.freeUnitsPerMonth - unitsUsed);
        }

        return {
          ...provider,
          unitsUsed,
          freeUnitsRemaining,
          hasCapacity: freeUnitsRemaining > 0,
        };
      })
    );

    // Find first provider with free capacity
    const freeProvider = providersWithUsage.find((p) => p.hasCapacity && p.isConfigured);

    // If no free capacity, fall back to the configured provider with lowest cost
    const fallbackProvider = providersWithUsage
      .filter((p) => p.isConfigured)
      .sort((a, b) => a.costPerUnit - b.costPerUnit)[0];

    const selected = freeProvider || fallbackProvider;

    return selected
      ? {
          provider: selected.provider,
          displayName: selected.displayName,
          freeUnitsRemaining: selected.freeUnitsRemaining,
          isUsingFreeTier: (selected.freeUnitsRemaining ?? 0) > 0,
          costPerUnit: selected.costPerUnit,
          unitType: selected.unitType,
        }
      : null;
  },
});

/**
 * Get usage summary for all providers of a service type
 */
export const getUsageSummary = query({
  args: {
    serviceType: v.union(
      v.literal("transcription"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("ai")
    ),
    month: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const month = args.month ?? getCurrentMonth();

    const providers = await ctx.db
      .query("serviceProviders")
      .withIndex("by_service_type", (q) => q.eq("serviceType", args.serviceType))
      .collect();

    const summary = await Promise.all(
      providers.map(async (provider) => {
        const usage = await ctx.db
          .query("serviceUsage")
          .withIndex("by_provider_month", (q) =>
            q.eq("provider", provider.provider).eq("month", month)
          )
          .first();

        const unitsUsed = usage?.unitsUsed ?? 0;
        let freeUnitsRemaining: number;

        if (provider.freeUnitsType === "one_time") {
          freeUnitsRemaining = provider.oneTimeUnitsRemaining ?? 0;
        } else {
          freeUnitsRemaining = Math.max(0, provider.freeUnitsPerMonth - unitsUsed);
        }

        return {
          provider: provider.provider,
          displayName: provider.displayName,
          isEnabled: provider.isEnabled,
          isConfigured: provider.isConfigured,
          priority: provider.priority,
          freeUnitsPerMonth: provider.freeUnitsPerMonth,
          freeUnitsType: provider.freeUnitsType,
          unitsUsed,
          freeUnitsRemaining,
          paidUnitsUsed: usage?.paidUnitsUsed ?? 0,
          estimatedCost: usage?.estimatedCost ?? 0,
          unitType: provider.unitType,
        };
      })
    );

    // Sort by priority
    summary.sort((a, b) => a.priority - b.priority);

    const totalFreeRemaining = summary.reduce((sum, p) => sum + p.freeUnitsRemaining, 0);
    const totalUsed = summary.reduce((sum, p) => sum + p.unitsUsed, 0);
    const totalCost = summary.reduce((sum, p) => sum + p.estimatedCost, 0);

    return {
      month,
      serviceType: args.serviceType,
      providers: summary,
      totals: {
        freeUnitsRemaining: totalFreeRemaining,
        unitsUsed: totalUsed,
        estimatedCostCents: totalCost,
      },
    };
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Record usage for a provider
 * Call this after each API call to track consumption
 */
export const recordUsage = mutation({
  args: {
    serviceType: v.union(
      v.literal("transcription"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("ai")
    ),
    provider: v.string(),
    unitsUsed: v.number(),
  },
  handler: async (ctx, args) => {
    const month = getCurrentMonth();

    // Get provider config
    const providerConfig = await ctx.db
      .query("serviceProviders")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .first();

    if (!providerConfig) {
      throw new Error(`Unknown provider: ${args.provider}`);
    }

    // Get or create usage record for this month
    const existingUsage = await ctx.db
      .query("serviceUsage")
      .withIndex("by_provider_month", (q) =>
        q.eq("provider", args.provider).eq("month", month)
      )
      .first();

    const currentUnitsUsed = existingUsage?.unitsUsed ?? 0;
    const newTotalUnits = currentUnitsUsed + args.unitsUsed;

    // Calculate free vs paid units
    let freeLimit: number;
    if (providerConfig.freeUnitsType === "one_time") {
      freeLimit = providerConfig.oneTimeUnitsRemaining ?? 0;
    } else {
      freeLimit = providerConfig.freeUnitsPerMonth;
    }

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
        serviceType: args.serviceType,
        provider: args.provider,
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
      const newRemaining = Math.max(0, providerConfig.oneTimeUnitsRemaining - args.unitsUsed);
      await ctx.db.patch(providerConfig._id, {
        oneTimeUnitsRemaining: newRemaining,
        updatedAt: Date.now(),
      });
    }

    return {
      provider: args.provider,
      unitsUsed: args.unitsUsed,
      totalUnitsThisMonth: newTotalUnits,
      freeUnitsRemaining: Math.max(0, freeLimit - newTotalUnits),
      isUsingFreeTier: newTotalUnits <= freeLimit,
    };
  },
});

/**
 * Initialize or update a provider configuration
 */
export const upsertProvider = mutation({
  args: {
    serviceType: v.union(
      v.literal("transcription"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("ai")
    ),
    provider: v.string(),
    displayName: v.string(),
    freeUnitsPerMonth: v.number(),
    freeUnitsType: v.union(v.literal("monthly"), v.literal("one_time"), v.literal("yearly")),
    oneTimeUnitsRemaining: v.optional(v.number()),
    costPerUnit: v.number(),
    unitType: v.string(),
    isEnabled: v.boolean(),
    isConfigured: v.boolean(),
    priority: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serviceProviders")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("serviceProviders", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Seed default provider configurations
 */
export const seedProviders = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Transcription providers
    const transcriptionProviders = [
      {
        serviceType: "transcription" as const,
        provider: "speechmatics",
        displayName: "Speechmatics",
        freeUnitsPerMonth: 480, // 8 hours
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.5, // $0.005/min = 0.5 cents
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 1,
        notes: "8 hrs/month free, resets monthly",
      },
      {
        serviceType: "transcription" as const,
        provider: "gladia",
        displayName: "Gladia",
        freeUnitsPerMonth: 480, // 8 hours
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.5, // $0.005/min
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 2,
        notes: "8 hrs/month free, resets monthly",
      },
      {
        serviceType: "transcription" as const,
        provider: "azure",
        displayName: "Azure Speech",
        freeUnitsPerMonth: 300, // 5 hours
        freeUnitsType: "monthly" as const,
        costPerUnit: 1.7, // $0.017/min
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 3,
        notes: "5 hrs/month free, resets monthly",
      },
      {
        serviceType: "transcription" as const,
        provider: "assemblyai",
        displayName: "AssemblyAI",
        freeUnitsPerMonth: 6000, // 100 hours one-time
        freeUnitsType: "one_time" as const,
        oneTimeUnitsRemaining: 6000,
        costPerUnit: 0.25, // $0.0025/min
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 4,
        notes: "100 hrs one-time free credit",
      },
      {
        serviceType: "transcription" as const,
        provider: "deepgram",
        displayName: "Deepgram",
        freeUnitsPerMonth: 12000, // ~$200 credit at $0.0043/min ≈ 775 hrs, but let's say ~200 hrs
        freeUnitsType: "one_time" as const,
        oneTimeUnitsRemaining: 12000,
        costPerUnit: 0.43, // $0.0043/min
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 5,
        notes: "$200 one-time credit (never expires)",
      },
      {
        serviceType: "transcription" as const,
        provider: "whisper",
        displayName: "OpenAI Whisper",
        freeUnitsPerMonth: 0, // No free tier
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.6, // $0.006/min
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 99, // Last resort (paid)
        notes: "No free tier, $0.006/min",
      },
    ];

    // Email providers
    const emailProviders = [
      {
        serviceType: "email" as const,
        provider: "resend",
        displayName: "Resend",
        freeUnitsPerMonth: 3000, // 3000 emails/month
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.1, // $0.001/email = 0.1 cents (after free tier)
        unitType: "email",
        isEnabled: true,
        isConfigured: false,
        priority: 1,
        notes: "3000 emails/month free",
      },
      {
        serviceType: "email" as const,
        provider: "sendpulse",
        displayName: "SendPulse",
        freeUnitsPerMonth: 15000, // 15000 emails/month
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.08, // ~$0.0008/email
        unitType: "email",
        isEnabled: true,
        isConfigured: false,
        priority: 2,
        notes: "15000 emails/month free (up to 500 subscribers)",
      },
      {
        serviceType: "email" as const,
        provider: "mailgun",
        displayName: "Mailgun",
        freeUnitsPerMonth: 1000, // 1000 emails/month (flex trial)
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.1, // $0.001/email
        unitType: "email",
        isEnabled: true,
        isConfigured: false,
        priority: 3,
        notes: "1000 emails/month on flex plan",
      },
    ];

    // Insert all providers
    for (const provider of [...transcriptionProviders, ...emailProviders]) {
      const existing = await ctx.db
        .query("serviceProviders")
        .withIndex("by_provider", (q) => q.eq("provider", provider.provider))
        .first();

      if (!existing) {
        await ctx.db.insert("serviceProviders", {
          ...provider,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { seeded: true };
  },
});

/**
 * Mark a provider as configured (has API key)
 */
export const setProviderConfigured = mutation({
  args: {
    provider: v.string(),
    isConfigured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serviceProviders")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .first();

    if (!existing) {
      throw new Error(`Unknown provider: ${args.provider}`);
    }

    await ctx.db.patch(existing._id, {
      isConfigured: args.isConfigured,
      updatedAt: Date.now(),
    });
  },
});
