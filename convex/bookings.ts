import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Bookings - Handle meeting bookings via booking pages
 * Supports confirmation workflow and calendar integration
 */

// Create a new booking (public - no auth required)
export const createBooking = mutation({
  args: {
    bookingPageSlug: v.string(),
    bookerName: v.string(),
    bookerEmail: v.string(),
    bookerPhone: v.optional(v.string()),
    bookerAnswers: v.optional(v.string()), // JSON string
    startTime: v.number(), // Unix timestamp
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    // Get booking page
    const page = await ctx.db
      .query("bookingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.bookingPageSlug))
      .first();

    if (!page || !page.isActive) {
      throw new Error("Booking page not found or inactive");
    }

    // Calculate end time
    const endTime = args.startTime + page.duration * 60 * 1000;

    // Check minimum notice
    const now = Date.now();
    const hoursUntilMeeting = (args.startTime - now) / (1000 * 60 * 60);
    if (hoursUntilMeeting < page.minimumNotice) {
      throw new Error(`This meeting requires at least ${page.minimumNotice} hours notice`);
    }

    // Check if slot is still available
    const conflictingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_host", (q) => q.eq("hostId", page.userId))
      .filter((q) =>
        q.and(
          q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "confirmed")),
          q.or(
            // New booking starts during existing booking
            q.and(
              q.lte(q.field("startTime"), args.startTime),
              q.gt(q.field("endTime"), args.startTime),
            ),
            // New booking ends during existing booking
            q.and(q.lt(q.field("startTime"), endTime), q.gte(q.field("endTime"), endTime)),
            // New booking completely contains existing booking
            q.and(q.gte(q.field("startTime"), args.startTime), q.lte(q.field("endTime"), endTime)),
          ),
        ),
      )
      .collect();

    if (conflictingBookings.length > 0) {
      throw new Error("This time slot is no longer available");
    }

    // Create the booking
    const bookingId = await ctx.db.insert("bookings", {
      bookingPageId: page._id,
      hostId: page.userId,
      bookerName: args.bookerName,
      bookerEmail: args.bookerEmail,
      bookerPhone: args.bookerPhone,
      bookerAnswers: args.bookerAnswers,
      startTime: args.startTime,
      endTime,
      timezone: args.timezone,
      location: page.location,
      locationDetails: page.locationDetails,
      status: page.requiresConfirmation ? "pending" : "confirmed",
      reminderSent: false,
      createdAt: now,
      updatedAt: now,
    });

    // If auto-confirm, create calendar event
    if (!page.requiresConfirmation) {
      const eventId = await ctx.db.insert("calendarEvents", {
        title: `${page.title} with ${args.bookerName}`,
        description: `Booked via ${args.bookingPageSlug}`,
        startTime: args.startTime,
        endTime,
        allDay: false,
        location: page.locationDetails,
        eventType: "meeting",
        organizerId: page.userId,
        attendeeIds: [],
        externalAttendees: [args.bookerEmail],
        status: "confirmed",
        isRecurring: false,
        meetingUrl: page.location === "zoom" ? page.locationDetails : undefined,
        createdAt: now,
        updatedAt: now,
      });

      // Link booking to calendar event
      await ctx.db.patch(bookingId, { calendarEventId: eventId });
    }

    return bookingId;
  },
});

// Get available time slots for a booking page
export const getAvailableSlots = query({
  args: {
    bookingPageSlug: v.string(),
    date: v.number(), // Date to check (start of day timestamp)
    timezone: v.string(), // Booker's timezone
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("bookingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.bookingPageSlug))
      .first();

    if (!page || !page.isActive) return [];

    // Get host's availability for this day of week
    const date = new Date(args.date);
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ] as const;
    const dayOfWeek = dayNames[date.getDay()];

    const availability = await ctx.db
      .query("availabilitySlots")
      .withIndex("by_user_day", (q) => q.eq("userId", page.userId).eq("dayOfWeek", dayOfWeek))
      .first();

    if (!availability || !availability.isActive) return [];

    // Get existing bookings for this day
    const dayStart = args.date;
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_host", (q) => q.eq("hostId", page.userId))
      .filter((q) =>
        q.and(
          q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "confirmed")),
          q.gte(q.field("startTime"), dayStart),
          q.lt(q.field("startTime"), dayEnd),
        ),
      )
      .collect();

    // Generate available slots
    const slots: number[] = [];
    const slotDuration = page.duration; // minutes

    // Parse start and end times
    const [startHour, startMinute] = availability.startTime.split(":").map(Number);
    const [endHour, endMinute] = availability.endTime.split(":").map(Number);

    const currentTime = new Date(args.date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(args.date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Generate all possible slots
    while (currentTime.getTime() + slotDuration * 60 * 1000 <= endTime.getTime()) {
      const slotStart = currentTime.getTime();
      const slotEnd = slotStart + slotDuration * 60 * 1000;

      // Check if slot conflicts with existing bookings
      const hasConflict = existingBookings.some((booking) => {
        // Add buffer time
        const bufferedStart = booking.startTime - page.bufferTimeBefore * 60 * 1000;
        const bufferedEnd = booking.endTime + page.bufferTimeAfter * 60 * 1000;

        return slotStart < bufferedEnd && slotEnd > bufferedStart;
      });

      // Check minimum notice
      const hoursUntilSlot = (slotStart - Date.now()) / (1000 * 60 * 60);

      if (!hasConflict && hoursUntilSlot >= page.minimumNotice) {
        slots.push(slotStart);
      }

      // Move to next slot (15-minute increments)
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return slots;
  },
});

// List bookings for host
export const listMyBookings = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("cancelled"),
        v.literal("completed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const bookings = args.status
      ? await ctx.db
          .query("bookings")
          .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", args.status))
          .collect()
      : await ctx.db
          .query("bookings")
          .withIndex("by_host", (q) => q.eq("hostId", userId))
          .collect();

    // Enrich with booking page details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const page = await ctx.db.get(booking.bookingPageId);
        return {
          ...booking,
          pageTitle: page?.title,
          pageSlug: page?.slug,
        };
      }),
    );

    return enrichedBookings.sort((a, b) => a.startTime - b.startTime);
  },
});

// Confirm a pending booking
export const confirmBooking = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Booking not found");
    if (booking.hostId !== userId) throw new Error("Not authorized");

    if (booking.status !== "pending") {
      throw new Error("Only pending bookings can be confirmed");
    }

    // Create calendar event
    const page = await ctx.db.get(booking.bookingPageId);
    if (!page) throw new Error("Booking page not found");

    const now = Date.now();

    const eventId = await ctx.db.insert("calendarEvents", {
      title: `${page.title} with ${booking.bookerName}`,
      description: `Booked via ${page.slug}`,
      startTime: booking.startTime,
      endTime: booking.endTime,
      allDay: false,
      location: booking.locationDetails,
      eventType: "meeting",
      organizerId: userId,
      attendeeIds: [],
      externalAttendees: [booking.bookerEmail],
      status: "confirmed",
      isRecurring: false,
      meetingUrl: page.location === "zoom" ? page.locationDetails : undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.id, {
      status: "confirmed",
      calendarEventId: eventId,
      updatedAt: now,
    });
  },
});

// Cancel a booking
export const cancelBooking = mutation({
  args: {
    id: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Booking not found");
    if (booking.hostId !== userId) throw new Error("Not authorized");

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error("Cannot cancel this booking");
    }

    // Cancel linked calendar event if it exists
    if (booking.calendarEventId) {
      await ctx.db.patch(booking.calendarEventId, {
        status: "cancelled",
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      cancelledBy: "host",
      cancellationReason: args.reason,
      updatedAt: Date.now(),
    });
  },
});
