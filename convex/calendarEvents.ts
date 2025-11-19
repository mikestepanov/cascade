import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Calendar Events - CRUD operations for internal calendar
 * Supports meetings, deadlines, time blocks, and personal events
 */

// Create a new calendar event
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    allDay: v.boolean(),
    location: v.optional(v.string()),
    eventType: v.union(
      v.literal("meeting"),
      v.literal("deadline"),
      v.literal("timeblock"),
      v.literal("personal"),
    ),
    attendeeIds: v.optional(v.array(v.id("users"))),
    externalAttendees: v.optional(v.array(v.string())),
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    status: v.optional(
      v.union(v.literal("confirmed"), v.literal("tentative"), v.literal("cancelled")),
    ),
    isRecurring: v.optional(v.boolean()),
    recurrenceRule: v.optional(v.string()),
    meetingUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate times
    if (args.endTime <= args.startTime) {
      throw new Error("End time must be after start time");
    }

    const now = Date.now();

    const eventId = await ctx.db.insert("calendarEvents", {
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      allDay: args.allDay,
      location: args.location,
      eventType: args.eventType,
      organizerId: userId,
      attendeeIds: args.attendeeIds || [],
      externalAttendees: args.externalAttendees,
      projectId: args.projectId,
      issueId: args.issueId,
      status: args.status || "confirmed",
      isRecurring: args.isRecurring,
      recurrenceRule: args.recurrenceRule,
      meetingUrl: args.meetingUrl,
      notes: args.notes,
      isRequired: args.isRequired,
      createdAt: now,
      updatedAt: now,
    });

    return eventId;
  },
});

// Get a single event by ID
export const get = query({
  args: { id: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const event = await ctx.db.get(args.id);
    if (!event) return null;

    // Check access: user must be organizer or attendee
    const isOrganizer = event.organizerId === userId;
    const isAttendee = event.attendeeIds.includes(userId);

    if (!(isOrganizer || isAttendee)) {
      return null; // Not authorized to view
    }

    // Enrich with organizer details
    const organizer = await ctx.db.get(event.organizerId);

    return {
      ...event,
      organizerName: organizer?.name,
      organizerEmail: organizer?.email,
    };
  },
});

// List events for a date range
export const listByDateRange = query({
  args: {
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all events in the date range
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_start_time")
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), args.startDate),
          q.lte(q.field("startTime"), args.endDate),
        ),
      )
      .collect();

    // Filter to events user can see (organizer or attendee)
    const visibleEvents = events.filter(
      (event) => event.organizerId === userId || event.attendeeIds.includes(userId),
    );

    // Filter by project if specified
    const filteredEvents = args.projectId
      ? visibleEvents.filter((event) => event.projectId === args.projectId)
      : visibleEvents;

    // Enrich with organizer details
    const enrichedEvents = await Promise.all(
      filteredEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizerId);
        return {
          ...event,
          organizerName: organizer?.name,
          organizerEmail: organizer?.email,
        };
      }),
    );

    return enrichedEvents.sort((a, b) => a.startTime - b.startTime);
  },
});

// List all events for current user
export const listMine = query({
  args: {
    includeCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get events where user is organizer
    const organizedEvents = await ctx.db
      .query("calendarEvents")
      .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
      .collect();

    // Get all events to filter for attendee
    const allEvents = await ctx.db.query("calendarEvents").collect();
    const attendingEvents = allEvents.filter((event) => event.attendeeIds.includes(userId));

    // Combine and deduplicate
    const eventIds = new Set();
    const combinedEvents = [...organizedEvents, ...attendingEvents].filter((event) => {
      if (eventIds.has(event._id)) return false;
      eventIds.add(event._id);
      return true;
    });

    // Filter out cancelled if requested
    const filteredEvents = args.includeCompleted
      ? combinedEvents
      : combinedEvents.filter((event) => event.status !== "cancelled");

    // Enrich with organizer details
    const enrichedEvents = await Promise.all(
      filteredEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizerId);
        return {
          ...event,
          organizerName: organizer?.name,
          organizerEmail: organizer?.email,
        };
      }),
    );

    return enrichedEvents.sort((a, b) => a.startTime - b.startTime);
  },
});

// Update an existing event
export const update = mutation({
  args: {
    id: v.id("calendarEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    eventType: v.optional(
      v.union(
        v.literal("meeting"),
        v.literal("deadline"),
        v.literal("timeblock"),
        v.literal("personal"),
      ),
    ),
    attendeeIds: v.optional(v.array(v.id("users"))),
    externalAttendees: v.optional(v.array(v.string())),
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    status: v.optional(
      v.union(v.literal("confirmed"), v.literal("tentative"), v.literal("cancelled")),
    ),
    isRecurring: v.optional(v.boolean()),
    recurrenceRule: v.optional(v.string()),
    meetingUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    // Only organizer can update event
    if (event.organizerId !== userId) {
      throw new Error("Only the event organizer can update this event");
    }

    // Validate times if provided
    const startTime = args.startTime ?? event.startTime;
    const endTime = args.endTime ?? event.endTime;
    if (endTime <= startTime) {
      throw new Error("End time must be after start time");
    }

    await ctx.db.patch(args.id, {
      ...(args.title && { title: args.title }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.startTime && { startTime: args.startTime }),
      ...(args.endTime && { endTime: args.endTime }),
      ...(args.allDay !== undefined && { allDay: args.allDay }),
      ...(args.location !== undefined && { location: args.location }),
      ...(args.eventType && { eventType: args.eventType }),
      ...(args.attendeeIds && { attendeeIds: args.attendeeIds }),
      ...(args.externalAttendees !== undefined && {
        externalAttendees: args.externalAttendees,
      }),
      ...(args.projectId !== undefined && { projectId: args.projectId }),
      ...(args.issueId !== undefined && { issueId: args.issueId }),
      ...(args.status && { status: args.status }),
      ...(args.isRecurring !== undefined && { isRecurring: args.isRecurring }),
      ...(args.recurrenceRule !== undefined && { recurrenceRule: args.recurrenceRule }),
      ...(args.meetingUrl !== undefined && { meetingUrl: args.meetingUrl }),
      ...(args.notes !== undefined && { notes: args.notes }),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete an event
export const remove = mutation({
  args: { id: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    // Only organizer can delete event
    if (event.organizerId !== userId) {
      throw new Error("Only the event organizer can delete this event");
    }

    await ctx.db.delete(args.id);
  },
});

// Get upcoming events (next 7 days)
export const getUpcoming = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_start_time")
      .filter((q) =>
        q.and(q.gte(q.field("startTime"), now), q.lte(q.field("startTime"), sevenDaysFromNow)),
      )
      .collect();

    // Filter to events user can see
    const visibleEvents = events.filter(
      (event) =>
        (event.organizerId === userId || event.attendeeIds.includes(userId)) &&
        event.status !== "cancelled",
    );

    // Limit results
    const limitedEvents = args.limit ? visibleEvents.slice(0, args.limit) : visibleEvents;

    // Enrich with organizer details
    const enrichedEvents = await Promise.all(
      limitedEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizerId);
        return {
          ...event,
          organizerName: organizer?.name,
          organizerEmail: organizer?.email,
        };
      }),
    );

    return enrichedEvents.sort((a, b) => a.startTime - b.startTime);
  },
});
