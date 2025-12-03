/**
 * E2E Testing Helpers
 *
 * Provides utilities for E2E tests to bypass email verification.
 * Only works for emails ending in @inbox.mailtrap.io (test emails).
 *
 * The OTP is stored in a dedicated table and can be retrieved via HTTP endpoint.
 */

import { httpAction, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// OTP expiration (15 minutes, matching auth system)
const OTP_EXPIRATION_MS = 15 * 60 * 1000;

/**
 * Store an OTP for E2E test email
 * Called internally by OTPVerification for test emails
 */
export const storeTestOTP = internalMutation({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    // Only store for test emails
    if (!args.email.endsWith("@inbox.mailtrap.io")) {
      throw new Error("Can only store OTP for test emails");
    }

    // Delete any existing OTP for this email
    const existing = await ctx.db
      .query("e2eTestOTPs")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Store new OTP
    await ctx.db.insert("e2eTestOTPs", {
      email: args.email,
      otp: args.otp,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get the OTP for an E2E test email (public query for HTTP endpoint)
 */
export const getTestOTP = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Only allow test emails
    if (!args.email.endsWith("@inbox.mailtrap.io")) {
      return { error: "Only test emails allowed" };
    }

    const stored = await ctx.db
      .query("e2eTestOTPs")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!stored) {
      return { error: "OTP not found" };
    }

    // Check expiration
    if (Date.now() - stored.createdAt > OTP_EXPIRATION_MS) {
      return { error: "OTP expired" };
    }

    return { otp: stored.otp };
  },
});

/**
 * HTTP endpoint to retrieve test OTP
 * GET /e2e/otp?email=test@inbox.mailtrap.io
 *
 * Note: This is only for E2E testing. In production, this endpoint
 * should be disabled or protected.
 */
export const getOTPEndpoint = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return new Response(JSON.stringify({ error: "Missing email parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only allow test emails
  if (!email.endsWith("@inbox.mailtrap.io")) {
    return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Query the database for the OTP
  const result = await ctx.runQuery(internal.e2e.getTestOTPInternal, { email });

  if (!result) {
    return new Response(JSON.stringify({ error: "OTP not found", email }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (result.expired) {
    return new Response(JSON.stringify({ error: "OTP expired" }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ otp: result.otp }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Internal query for HTTP action (can't use public query from httpAction)
 */
export const getTestOTPInternal = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const stored = await ctx.db
      .query("e2eTestOTPs")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!stored) {
      return null;
    }

    // Check expiration
    if (Date.now() - stored.createdAt > OTP_EXPIRATION_MS) {
      return { expired: true, otp: null };
    }

    return { expired: false, otp: stored.otp };
  },
});
