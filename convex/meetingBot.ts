import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// ===========================================
// Queries
// ===========================================

// Get all recordings for a user
export const listRecordings = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit ?? 20;

    let recordings;
    if (args.projectId) {
      recordings = await ctx.db
        .query("meetingRecordings")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(limit);
    } else {
      recordings = await ctx.db
        .query("meetingRecordings")
        .withIndex("by_creator", (q) => q.eq("createdBy", userId))
        .order("desc")
        .take(limit);
    }

    // Enrich with calendar event data
    return Promise.all(
      recordings.map(async (recording) => {
        const calendarEvent = recording.calendarEventId
          ? await ctx.db.get(recording.calendarEventId)
          : null;
        const transcript = await ctx.db
          .query("meetingTranscripts")
          .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
          .first();
        const summary = await ctx.db
          .query("meetingSummaries")
          .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
          .first();

        return {
          ...recording,
          calendarEvent,
          hasTranscript: !!transcript,
          hasSummary: !!summary,
        };
      })
    );
  },
});

// Get a single recording with all details
export const getRecording = query({
  args: { recordingId: v.id("meetingRecordings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    // Check access
    if (recording.createdBy !== userId && !recording.isPublic) {
      throw new Error("Not authorized to view this recording");
    }

    const calendarEvent = recording.calendarEventId
      ? await ctx.db.get(recording.calendarEventId)
      : null;

    const transcript = await ctx.db
      .query("meetingTranscripts")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    const summary = await ctx.db
      .query("meetingSummaries")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    const participants = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .collect();

    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    return {
      ...recording,
      calendarEvent,
      transcript,
      summary,
      participants,
      job,
    };
  },
});

// Get transcript for a recording
export const getTranscript = query({
  args: { recordingId: v.id("meetingRecordings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    if (recording.createdBy !== userId && !recording.isPublic) {
      throw new Error("Not authorized");
    }

    return ctx.db
      .query("meetingTranscripts")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .first();
  },
});

// Get summary for a recording
export const getSummary = query({
  args: { recordingId: v.id("meetingRecordings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    if (recording.createdBy !== userId && !recording.isPublic) {
      throw new Error("Not authorized");
    }

    return ctx.db
      .query("meetingSummaries")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .first();
  },
});

// Get pending bot jobs (for the bot service to poll)
export const getPendingJobs = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get jobs that are pending and scheduled to start within next 5 minutes
    const jobs = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Filter to jobs that should start soon
    const readyJobs = jobs.filter(
      (job) => job.scheduledTime <= now + 5 * 60 * 1000
    );

    // Enrich with recording data
    return Promise.all(
      readyJobs.map(async (job) => {
        const recording = await ctx.db.get(job.recordingId);
        return { ...job, recording };
      })
    );
  },
});

// ===========================================
// Mutations
// ===========================================

// Schedule a bot to join a meeting
export const scheduleRecording = mutation({
  args: {
    calendarEventId: v.optional(v.id("calendarEvents")),
    meetingUrl: v.string(),
    title: v.string(),
    meetingPlatform: v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("teams"),
      v.literal("other")
    ),
    scheduledStartTime: v.number(),
    projectId: v.optional(v.id("projects")),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    // Create the recording record
    const recordingId = await ctx.db.insert("meetingRecordings", {
      calendarEventId: args.calendarEventId,
      meetingUrl: args.meetingUrl,
      meetingPlatform: args.meetingPlatform,
      title: args.title,
      status: "scheduled",
      scheduledStartTime: args.scheduledStartTime,
      botName: "Cascade Notetaker",
      createdBy: userId,
      projectId: args.projectId,
      isPublic: args.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    });

    // Create the bot job
    await ctx.db.insert("meetingBotJobs", {
      recordingId,
      meetingUrl: args.meetingUrl,
      scheduledTime: args.scheduledStartTime,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
      updatedAt: now,
    });

    // Schedule the bot to start (Convex scheduler)
    await ctx.scheduler.runAt(
      new Date(args.scheduledStartTime),
      internal.meetingBot.triggerBotJob,
      { recordingId }
    );

    return recordingId;
  },
});

// Quick record - start recording immediately for an ad-hoc meeting
export const startRecordingNow = mutation({
  args: {
    meetingUrl: v.string(),
    title: v.string(),
    meetingPlatform: v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("teams"),
      v.literal("other")
    ),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    const recordingId = await ctx.db.insert("meetingRecordings", {
      meetingUrl: args.meetingUrl,
      meetingPlatform: args.meetingPlatform,
      title: args.title,
      status: "scheduled",
      scheduledStartTime: now,
      botName: "Cascade Notetaker",
      createdBy: userId,
      projectId: args.projectId,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("meetingBotJobs", {
      recordingId,
      meetingUrl: args.meetingUrl,
      scheduledTime: now,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
      updatedAt: now,
    });

    // Trigger immediately
    await ctx.scheduler.runAfter(0, internal.meetingBot.triggerBotJob, {
      recordingId,
    });

    return recordingId;
  },
});

// Cancel a scheduled recording
export const cancelRecording = mutation({
  args: { recordingId: v.id("meetingRecordings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    if (recording.createdBy !== userId) {
      throw new Error("Not authorized to cancel this recording");
    }

    if (recording.status !== "scheduled") {
      throw new Error("Can only cancel scheduled recordings");
    }

    // Update recording status
    await ctx.db.patch(args.recordingId, {
      status: "failed",
      errorMessage: "Cancelled by user",
      updatedAt: Date.now(),
    });

    // Cancel the job
    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .first();

    if (job) {
      await ctx.db.patch(job._id, {
        status: "cancelled",
        updatedAt: Date.now(),
      });
    }
  },
});

// Update recording status (called by bot service)
export const updateRecordingStatus = mutation({
  args: {
    recordingId: v.id("meetingRecordings"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("joining"),
      v.literal("recording"),
      v.literal("processing"),
      v.literal("transcribing"),
      v.literal("summarizing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    botJoinedAt: v.optional(v.number()),
    botLeftAt: v.optional(v.number()),
    actualStartTime: v.optional(v.number()),
    actualEndTime: v.optional(v.number()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    await ctx.db.patch(args.recordingId, {
      status: args.status,
      errorMessage: args.errorMessage,
      botJoinedAt: args.botJoinedAt ?? recording.botJoinedAt,
      botLeftAt: args.botLeftAt ?? recording.botLeftAt,
      actualStartTime: args.actualStartTime ?? recording.actualStartTime,
      actualEndTime: args.actualEndTime ?? recording.actualEndTime,
      duration: args.duration ?? recording.duration,
      updatedAt: Date.now(),
    });
  },
});

// Save transcript (called after Whisper processing)
export const saveTranscript = mutation({
  args: {
    recordingId: v.id("meetingRecordings"),
    fullText: v.string(),
    segments: v.array(
      v.object({
        startTime: v.number(),
        endTime: v.number(),
        speaker: v.optional(v.string()),
        speakerUserId: v.optional(v.id("users")),
        text: v.string(),
        confidence: v.optional(v.number()),
      })
    ),
    language: v.string(),
    modelUsed: v.string(),
    processingTime: v.optional(v.number()),
    wordCount: v.number(),
    speakerCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    const transcriptId = await ctx.db.insert("meetingTranscripts", {
      recordingId: args.recordingId,
      fullText: args.fullText,
      segments: args.segments,
      language: args.language,
      modelUsed: args.modelUsed,
      processingTime: args.processingTime,
      wordCount: args.wordCount,
      speakerCount: args.speakerCount,
      createdAt: Date.now(),
    });

    // Update recording status
    await ctx.db.patch(args.recordingId, {
      status: "summarizing",
      updatedAt: Date.now(),
    });

    return transcriptId;
  },
});

// Save summary (called after Claude processing)
export const saveSummary = mutation({
  args: {
    recordingId: v.id("meetingRecordings"),
    transcriptId: v.id("meetingTranscripts"),
    executiveSummary: v.string(),
    keyPoints: v.array(v.string()),
    actionItems: v.array(
      v.object({
        description: v.string(),
        assignee: v.optional(v.string()),
        assigneeUserId: v.optional(v.id("users")),
        dueDate: v.optional(v.string()),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        issueCreated: v.optional(v.id("issues")),
      })
    ),
    decisions: v.array(v.string()),
    openQuestions: v.array(v.string()),
    topics: v.array(
      v.object({
        title: v.string(),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        summary: v.string(),
      })
    ),
    overallSentiment: v.optional(
      v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative"), v.literal("mixed"))
    ),
    modelUsed: v.string(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    processingTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    const summaryId = await ctx.db.insert("meetingSummaries", {
      recordingId: args.recordingId,
      transcriptId: args.transcriptId,
      executiveSummary: args.executiveSummary,
      keyPoints: args.keyPoints,
      actionItems: args.actionItems,
      decisions: args.decisions,
      openQuestions: args.openQuestions,
      topics: args.topics,
      overallSentiment: args.overallSentiment,
      modelUsed: args.modelUsed,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      processingTime: args.processingTime,
      createdAt: Date.now(),
    });

    // Update recording status to completed
    await ctx.db.patch(args.recordingId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    // Update job status
    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .first();

    if (job) {
      await ctx.db.patch(job._id, {
        status: "completed",
        updatedAt: Date.now(),
      });
    }

    return summaryId;
  },
});

// Save participants
export const saveParticipants = mutation({
  args: {
    recordingId: v.id("meetingRecordings"),
    participants: v.array(
      v.object({
        displayName: v.string(),
        email: v.optional(v.string()),
        joinedAt: v.optional(v.number()),
        leftAt: v.optional(v.number()),
        speakingTime: v.optional(v.number()),
        speakingPercentage: v.optional(v.number()),
        isHost: v.boolean(),
        isExternal: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    // Try to match participants to Cascade users by email
    for (const participant of args.participants) {
      let userId: Id<"users"> | undefined;

      if (participant.email) {
        const user = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", participant.email))
          .first();
        userId = user?._id;
      }

      await ctx.db.insert("meetingParticipants", {
        recordingId: args.recordingId,
        displayName: participant.displayName,
        email: participant.email,
        userId,
        joinedAt: participant.joinedAt,
        leftAt: participant.leftAt,
        speakingTime: participant.speakingTime,
        speakingPercentage: participant.speakingPercentage,
        isHost: participant.isHost,
        isExternal: participant.isExternal,
      });
    }
  },
});

// Create issue from action item
export const createIssueFromActionItem = mutation({
  args: {
    summaryId: v.id("meetingSummaries"),
    actionItemIndex: v.number(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const summary = await ctx.db.get(args.summaryId);
    if (!summary) throw new Error("Summary not found");

    const actionItem = summary.actionItems[args.actionItemIndex];
    if (!actionItem) throw new Error("Action item not found");

    // Get project for issue key
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Get next issue number
    const existingIssues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const nextNumber = existingIssues.length + 1;

    const now = Date.now();

    // Create the issue
    const issueId = await ctx.db.insert("issues", {
      projectId: args.projectId,
      key: `${project.key}-${nextNumber}`,
      title: actionItem.description,
      description: `Created from meeting action item`,
      type: "task",
      status: project.workflowStates[0]?.id ?? "todo",
      priority: actionItem.priority ?? "medium",
      assigneeId: actionItem.assigneeUserId,
      reporterId: userId,
      createdAt: now,
      updatedAt: now,
      labels: ["from-meeting"],
      linkedDocuments: [],
      attachments: [],
      order: existingIssues.length,
    });

    // Update the action item with the created issue
    const updatedActionItems = [...summary.actionItems];
    updatedActionItems[args.actionItemIndex] = {
      ...actionItem,
      issueCreated: issueId,
    };

    await ctx.db.patch(args.summaryId, {
      actionItems: updatedActionItems,
    });

    return issueId;
  },
});

// ===========================================
// Internal Functions (called by scheduler)
// ===========================================

// Trigger bot job - called by scheduler when it's time to join a meeting
export const triggerBotJob = internalMutation({
  args: { recordingId: v.id("meetingRecordings") },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) return;

    if (recording.status !== "scheduled") return;

    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .first();

    if (!job || job.status !== "pending") return;

    // Update statuses
    await ctx.db.patch(args.recordingId, {
      status: "joining",
      updatedAt: Date.now(),
    });

    await ctx.db.patch(job._id, {
      status: "queued",
      updatedAt: Date.now(),
    });

    // The bot service will poll getPendingJobs and pick this up
    // Or we can call the bot service directly via HTTP action
    await ctx.scheduler.runAfter(0, internal.meetingBot.notifyBotService, {
      jobId: job._id,
      recordingId: args.recordingId,
      meetingUrl: recording.meetingUrl ?? "",
    });
  },
});

// Notify bot service to start a job
export const notifyBotService = internalAction({
  args: {
    jobId: v.id("meetingBotJobs"),
    recordingId: v.id("meetingRecordings"),
    meetingUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Get bot service URL from environment
    const botServiceUrl = process.env.BOT_SERVICE_URL;

    if (!botServiceUrl) {
      console.error("BOT_SERVICE_URL not configured");
      // Update job as failed
      await ctx.runMutation(internal.meetingBot.markJobFailed, {
        jobId: args.jobId,
        recordingId: args.recordingId,
        error: "Bot service not configured",
      });
      return;
    }

    try {
      const response = await fetch(`${botServiceUrl}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BOT_SERVICE_API_KEY}`,
        },
        body: JSON.stringify({
          jobId: args.jobId,
          recordingId: args.recordingId,
          meetingUrl: args.meetingUrl,
          platform: "google_meet", // For now, hardcoded
          botName: "Cascade Notetaker",
          // Callback URLs for the bot to report status
          callbackUrl: process.env.CONVEX_SITE_URL,
        }),
      });

      if (!response.ok) {
        throw new Error(`Bot service responded with ${response.status}`);
      }

      const data = await response.json();

      // Update job with bot service job ID
      await ctx.runMutation(internal.meetingBot.updateJobBotServiceId, {
        jobId: args.jobId,
        botServiceJobId: data.jobId,
      });
    } catch (error) {
      console.error("Failed to notify bot service:", error);
      await ctx.runMutation(internal.meetingBot.markJobFailed, {
        jobId: args.jobId,
        recordingId: args.recordingId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

export const updateJobBotServiceId = internalMutation({
  args: {
    jobId: v.id("meetingBotJobs"),
    botServiceJobId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      botServiceJobId: args.botServiceJobId,
      status: "running",
      updatedAt: Date.now(),
    });
  },
});

export const markJobFailed = internalMutation({
  args: {
    jobId: v.id("meetingBotJobs"),
    recordingId: v.id("meetingRecordings"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return;

    const newAttempts = job.attempts + 1;

    if (newAttempts < job.maxAttempts) {
      // Retry in 1 minute
      const nextAttempt = Date.now() + 60 * 1000;
      await ctx.db.patch(args.jobId, {
        attempts: newAttempts,
        lastAttemptAt: Date.now(),
        nextAttemptAt: nextAttempt,
        errorMessage: args.error,
        status: "pending",
        updatedAt: Date.now(),
      });

      // Schedule retry
      await ctx.scheduler.runAt(
        new Date(nextAttempt),
        internal.meetingBot.triggerBotJob,
        { recordingId: args.recordingId }
      );
    } else {
      // Max attempts reached, mark as failed
      await ctx.db.patch(args.jobId, {
        attempts: newAttempts,
        lastAttemptAt: Date.now(),
        errorMessage: args.error,
        status: "failed",
        updatedAt: Date.now(),
      });

      await ctx.db.patch(args.recordingId, {
        status: "failed",
        errorMessage: args.error,
        updatedAt: Date.now(),
      });
    }
  },
});
