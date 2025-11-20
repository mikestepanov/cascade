import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Meeting Attendance Tracking
 * For required meetings - admins/organizers mark who attended, was tardy, or missed
 */

// Mark attendance for an attendee
export const markAttendance = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    userId: v.id("users"),
    status: v.union(v.literal("present"), v.literal("tardy"), v.literal("absent")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    // Get event
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Only organizer can mark attendance
    if (event.organizerId !== currentUserId) {
      throw new Error("Only the event organizer can mark attendance");
    }

    // Check if attendance already exists
    const existing = await ctx.db
      .query("meetingAttendance")
      .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing attendance
      await ctx.db.patch(existing._id, {
        status: args.status,
        notes: args.notes,
        markedBy: currentUserId,
        markedAt: now,
      });
      return existing._id;
    }

    // Create new attendance record
    const attendanceId = await ctx.db.insert("meetingAttendance", {
      eventId: args.eventId,
      userId: args.userId,
      status: args.status,
      markedBy: currentUserId,
      markedAt: now,
      notes: args.notes,
    });
    return attendanceId;
  },
});

// Get attendance for an event
export const getAttendance = query({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get event
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    // Only organizer can view attendance
    if (event.organizerId !== userId) {
      return null;
    }

    // Get all attendance records for this event
    const attendanceRecords = await ctx.db
      .query("meetingAttendance")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get all attendees (from attendeeIds)
    const attendees = await Promise.all(
      event.attendeeIds.map(async (attendeeId) => {
        const user = await ctx.db.get(attendeeId);
        const attendance = attendanceRecords.find((a) => a.userId === attendeeId);

        return {
          userId: attendeeId,
          userName: user?.name || "Unknown",
          userEmail: user?.email,
          status: attendance?.status,
          notes: attendance?.notes,
          markedAt: attendance?.markedAt,
        };
      }),
    );

    return {
      attendees,
      totalAttendees: event.attendeeIds.length,
      markedCount: attendanceRecords.length,
    };
  },
});

// Get attendance history for a user (for reports)
export const getUserAttendanceHistory = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) return [];

    // Get attendance records for user
    const attendanceRecords = await ctx.db
      .query("meetingAttendance")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrich with event details
    const enriched = await Promise.all(
      attendanceRecords.map(async (record) => {
        const event = await ctx.db.get(record.eventId);
        if (!event) return null;

        // Filter by date range if specified
        if (args.startDate && event.startTime < args.startDate) return null;
        if (args.endDate && event.startTime > args.endDate) return null;

        const organizer = await ctx.db.get(event.organizerId);

        return {
          ...record,
          eventTitle: event.title,
          eventStartTime: event.startTime,
          eventEndTime: event.endTime,
          organizerName: organizer?.name,
        };
      }),
    );

    // Filter out nulls and sort by date
    return enriched
      .filter((record): record is NonNullable<typeof record> => record !== null)
      .sort((a, b) => b.eventStartTime - a.eventStartTime);
  },
});

// Get attendance summary report (for admins/CEO)
export const getAttendanceReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get all required meetings in date range
    const allEvents = await ctx.db.query("calendarEvents").collect();

    const requiredMeetings = allEvents.filter((event) => {
      if (!event.isRequired) return false;
      if (args.startDate && event.startTime < args.startDate) return false;
      if (args.endDate && event.startTime > args.endDate) return false;
      return true;
    });

    // Get all attendance records for these meetings
    const allAttendance = await ctx.db.query("meetingAttendance").collect();

    // Build summary by user
    const userSummaries = new Map<
      string,
      {
        userId: string;
        userName: string;
        totalMeetings: number;
        present: number;
        tardy: number;
        absent: number;
        notMarked: number;
      }
    >();

    for (const meeting of requiredMeetings) {
      for (const attendeeId of meeting.attendeeIds) {
        let summary = userSummaries.get(attendeeId);
        if (!summary) {
          const user = await ctx.db.get(attendeeId);
          summary = {
            userId: attendeeId,
            userName: user?.name || "Unknown",
            totalMeetings: 0,
            present: 0,
            tardy: 0,
            absent: 0,
            notMarked: 0,
          };
          userSummaries.set(attendeeId, summary);
        }

        summary.totalMeetings++;

        const attendance = allAttendance.find(
          (a) => a.eventId === meeting._id && a.userId === attendeeId,
        );

        if (attendance) {
          if (attendance.status === "present") summary.present++;
          else if (attendance.status === "tardy") summary.tardy++;
          else if (attendance.status === "absent") summary.absent++;
        } else {
          summary.notMarked++;
        }
      }
    }

    return {
      totalRequiredMeetings: requiredMeetings.length,
      attendeeSummaries: Array.from(userSummaries.values()).sort((a, b) =>
        a.userName.localeCompare(b.userName),
      ),
    };
  },
});
