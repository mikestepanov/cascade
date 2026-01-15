import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { OTPPasswordReset } from "./OTPPasswordReset";
import { OTPVerification } from "./OTPVerification";

// All OTP emails use the universal email provider system
// Provider rotation (SendPulse, Mailtrap, Resend, Mailgun) is automatic
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Password({
      reset: OTPPasswordReset,
      verify: OTPVerification,
    }),
  ],
});

export const loggedInUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      image: v.optional(v.string()),
      isAnonymous: v.optional(v.boolean()),
      defaultCompanyId: v.optional(v.id("companies")),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});

import { ROUTE_PATTERNS } from "./shared/routes";

/**
 * Get the recommended destination for a user after they authenticate.
 * This is the smart logic that decides between onboarding and dashboard.
 */
export const getRedirectDestination = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // 1. Check onboarding status
    const onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const onboardingIncomplete = !onboarding?.onboardingCompleted;

    if (onboardingIncomplete) {
      return ROUTE_PATTERNS.onboarding;
    }

    // 2. Check for companies
    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (membership) {
      const company = await ctx.db.get(membership.companyId);
      if (company?.slug) {
        return `/${company.slug}/dashboard`;
      }
    }

    // If they finished onboarding but have no company,
    // we should send them to /app gateway where InitializeCompany will handle them.
    return ROUTE_PATTERNS.app;
  },
});
