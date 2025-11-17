import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Booking Pages - Cal.com-style booking page management
 * Create shareable booking links for meetings
 */

// Create a booking page
export const create = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(), // Minutes
    bufferTimeBefore: v.optional(v.number()),
    bufferTimeAfter: v.optional(v.number()),
    minimumNotice: v.optional(v.number()), // Hours
    maxBookingsPerDay: v.optional(v.number()),
    location: v.union(
      v.literal("phone"),
      v.literal("zoom"),
      v.literal("meet"),
      v.literal("teams"),
      v.literal("in-person"),
      v.literal("custom"),
    ),
    locationDetails: v.optional(v.string()),
    questions: v.optional(
      v.array(
        v.object({
          label: v.string(),
          type: v.union(v.literal("text"), v.literal("email"), v.literal("phone")),
          required: v.boolean(),
        }),
      ),
    ),
    requiresConfirmation: v.optional(v.boolean()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if slug is already taken
    const existing = await ctx.db
      .query("bookingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("This booking URL is already taken");
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(args.slug)) {
      throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
    }

    const now = Date.now();

    return await ctx.db.insert("bookingPages", {
      userId,
      slug: args.slug,
      title: args.title,
      description: args.description,
      duration: args.duration,
      bufferTimeBefore: args.bufferTimeBefore || 0,
      bufferTimeAfter: args.bufferTimeAfter || 0,
      minimumNotice: args.minimumNotice || 24, // Default 24 hours
      maxBookingsPerDay: args.maxBookingsPerDay,
      location: args.location,
      locationDetails: args.locationDetails,
      questions: args.questions,
      isActive: true,
      requiresConfirmation: args.requiresConfirmation || false,
      color: args.color || "#3B82F6",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get booking page by slug (public)
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("bookingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!page || !page.isActive) return null;

    // Get host info
    const host = await ctx.db.get(page.userId);

    return {
      ...page,
      hostName: host?.name,
      hostEmail: host?.email,
    };
  },
});

// List user's booking pages
export const listMine = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const pages = await ctx.db
      .query("bookingPages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return pages.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Update booking page
export const update = mutation({
  args: {
    id: v.id("bookingPages"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    bufferTimeBefore: v.optional(v.number()),
    bufferTimeAfter: v.optional(v.number()),
    minimumNotice: v.optional(v.number()),
    maxBookingsPerDay: v.optional(v.number()),
    location: v.optional(
      v.union(
        v.literal("phone"),
        v.literal("zoom"),
        v.literal("meet"),
        v.literal("teams"),
        v.literal("in-person"),
        v.literal("custom"),
      ),
    ),
    locationDetails: v.optional(v.string()),
    questions: v.optional(
      v.array(
        v.object({
          label: v.string(),
          type: v.union(v.literal("text"), v.literal("email"), v.literal("phone")),
          required: v.boolean(),
        }),
      ),
    ),
    isActive: v.optional(v.boolean()),
    requiresConfirmation: v.optional(v.boolean()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const page = await ctx.db.get(args.id);
    if (!page) throw new Error("Booking page not found");
    if (page.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.id, {
      ...(args.title && { title: args.title }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.duration && { duration: args.duration }),
      ...(args.bufferTimeBefore !== undefined && {
        bufferTimeBefore: args.bufferTimeBefore,
      }),
      ...(args.bufferTimeAfter !== undefined && { bufferTimeAfter: args.bufferTimeAfter }),
      ...(args.minimumNotice !== undefined && { minimumNotice: args.minimumNotice }),
      ...(args.maxBookingsPerDay !== undefined && {
        maxBookingsPerDay: args.maxBookingsPerDay,
      }),
      ...(args.location && { location: args.location }),
      ...(args.locationDetails !== undefined && { locationDetails: args.locationDetails }),
      ...(args.questions !== undefined && { questions: args.questions }),
      ...(args.isActive !== undefined && { isActive: args.isActive }),
      ...(args.requiresConfirmation !== undefined && {
        requiresConfirmation: args.requiresConfirmation,
      }),
      ...(args.color && { color: args.color }),
      updatedAt: Date.now(),
    });
  },
});

// Delete booking page
export const remove = mutation({
  args: { id: v.id("bookingPages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const page = await ctx.db.get(args.id);
    if (!page) throw new Error("Booking page not found");
    if (page.userId !== userId) throw new Error("Not authorized");

    // Check for active bookings
    const activeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_booking_page", (q) => q.eq("bookingPageId", args.id))
      .filter((q) => q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "confirmed")))
      .collect();

    if (activeBookings.length > 0) {
      throw new Error(
        "Cannot delete booking page with active bookings. Cancel or complete them first.",
      );
    }

    await ctx.db.delete(args.id);
  },
});

// Toggle booking page active status
export const toggleActive = mutation({
  args: {
    id: v.id("bookingPages"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const page = await ctx.db.get(args.id);
    if (!page) throw new Error("Booking page not found");
    if (page.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
  },
});
