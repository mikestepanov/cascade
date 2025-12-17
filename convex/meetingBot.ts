import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import { batchFetchCalendarEvents, batchFetchRecordings } from "./lib/batchHelpers";
import { getBotServiceApiKey, getBotServiceUrl } from "./lib/env";

// ===========================================
// Bot Service Authentication
// ===========================================

/**
 * Validate bot service API key
 * The bot service uses a dedicated API key stored in environment variables
 * This is simpler than the user API key system since there's only one bot service
 */
async function validateBotApiKey(ctx: QueryCtx | MutationCtx, apiKey: string): Promise<boolean> {
  // Get the expected API key from system settings or environment
  // For now, we store the hashed key in a systemSettings table
  const settings = await ctx.db
    .query("systemSettings")
    .withIndex("by_key", (q) => q.eq("key", "botServiceApiKeyHash"))
    .first();

  if (!settings) {
    return false;
  }

  // Hash the provided key and compare
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return keyHash === settings.value;
}

/**
 * Validate bot API key and throw if invalid
 */
async function requireBotApiKey(
  ctx: QueryCtx | MutationCtx,
  apiKey: string | undefined,
): Promise<void> {
  if (!apiKey) {
    throw new Error("Bot service API key required");
  }
  const isValid = await validateBotApiKey(ctx, apiKey);
  if (!isValid) {
    throw new Error("Invalid bot service API key");
  }
}

// ===========================================
// Queries
// ===========================================

// Get all recordings for a user
export const listRecordings = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("meetingRecordings"),
      _creationTime: v.number(),
      calendarEventId: v.optional(v.id("calendarEvents")),
      meetingUrl: v.optional(v.string()),
      meetingPlatform: v.union(
        v.literal("google_meet"),
        v.literal("zoom"),
        v.literal("teams"),
        v.literal("other"),
      ),
      title: v.string(),
      recordingFileId: v.optional(v.id("_storage")),
      recordingUrl: v.optional(v.string()),
      duration: v.optional(v.number()),
      fileSize: v.optional(v.number()),
      status: v.union(
        v.literal("scheduled"),
        v.literal("joining"),
        v.literal("recording"),
        v.literal("processing"),
        v.literal("transcribing"),
        v.literal("summarizing"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("failed"),
      ),
      errorMessage: v.optional(v.string()),
      scheduledStartTime: v.optional(v.number()),
      actualStartTime: v.optional(v.number()),
      actualEndTime: v.optional(v.number()),
      botJoinedAt: v.optional(v.number()),
      botLeftAt: v.optional(v.number()),
      botName: v.string(),
      createdBy: v.id("users"),
      projectId: v.optional(v.id("projects")),
      isPublic: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
      calendarEvent: v.union(v.any(), v.null()),
      hasTranscript: v.boolean(),
      hasSummary: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit ?? 20;

    let recordings: Doc<"meetingRecordings">[];
    if (args.projectId) {
      recordings = await ctx.db
        .query("meetingRecordings")
        .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(limit);
    } else {
      recordings = await ctx.db
        .query("meetingRecordings")
        .withIndex("by_creator", (q) => q.eq("createdBy", userId))
        .order("desc")
        .take(limit);
    }

    // Batch fetch all related data to avoid N+1 queries
    const calendarEventIds = recordings
      .map((r) => r.calendarEventId)
      .filter((id): id is Id<"calendarEvents"> => !!id);
    const recordingIds = recordings.map((r) => r._id);

    // Parallel fetch: calendar events, transcripts, summaries
    const [calendarEventMap, allTranscripts, allSummaries] = await Promise.all([
      batchFetchCalendarEvents(ctx, calendarEventIds),
      Promise.all(
        recordingIds.map((recordingId) =>
          ctx.db
            .query("meetingTranscripts")
            .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
            .first(),
        ),
      ),
      Promise.all(
        recordingIds.map((recordingId) =>
          ctx.db
            .query("meetingSummaries")
            .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
            .first(),
        ),
      ),
    ]);

    // Build lookup maps
    const transcriptMap = new Map(recordingIds.map((id, i) => [id.toString(), allTranscripts[i]]));
    const summaryMap = new Map(recordingIds.map((id, i) => [id.toString(), allSummaries[i]]));

    // Enrich with pre-fetched data (no N+1 - all fetches are parallel)
    return recordings.map((recording) => ({
      ...recording,
      calendarEvent: recording.calendarEventId
        ? (calendarEventMap.get(recording.calendarEventId) ?? null)
        : null,
      hasTranscript: !!transcriptMap.get(recording._id.toString()),
      hasSummary: !!summaryMap.get(recording._id.toString()),
    }));
  },
});

// Get recording by calendar event ID (optimized for MeetingRecordingSection)
export const getRecordingByCalendarEvent = query({
  args: { calendarEventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recording = await ctx.db
      .query("meetingRecordings")
      .withIndex("by_calendar_event", (q) => q.eq("calendarEventId", args.calendarEventId))
      .first();

    if (!recording) return null;

    // Check access
    if (recording.createdBy !== userId && !recording.isPublic) {
      return null;
    }

    const summary = await ctx.db
      .query("meetingSummaries")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    return {
      ...recording,
      hasSummary: !!summary,
      summary,
      job,
    };
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
// Requires bot service API key authentication
export const getPendingJobs = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

    const now = Date.now();

    // Get jobs that are pending and scheduled to start within next 5 minutes
    const jobs = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Filter to jobs that should start soon
    const readyJobs = jobs.filter((job) => job.scheduledTime <= now + 5 * 60 * 1000);

    // Batch fetch recordings to avoid N+1 queries
    const recordingIds = readyJobs.map((job) => job.recordingId);
    const recordingMap = await batchFetchRecordings(ctx, recordingIds);

    // Enrich with pre-fetched recording data (no N+1)
    return readyJobs.map((job) => ({
      ...job,
      recording: recordingMap.get(job.recordingId) ?? null,
    }));
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
      v.literal("other"),
    ),
    scheduledStartTime: v.number(),
    projectId: v.optional(v.id("projects")),
    isPublic: v.optional(v.boolean()),
  },
  returns: v.id("meetingRecordings"),
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
      botName: "Nixelo Notetaker",
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
      { recordingId },
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
      v.literal("other"),
    ),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.id("meetingRecordings"),
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
      botName: "Nixelo Notetaker",
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    if (recording.createdBy !== userId) {
      throw new Error("Not authorized to cancel this recording");
    }

    if (recording.status !== "scheduled") {
      throw new Error(
        `Cannot cancel recording with status '${recording.status}'. Only scheduled recordings can be cancelled.`,
      );
    }

    // Update recording status
    await ctx.db.patch(args.recordingId, {
      status: "cancelled",
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
// Requires bot service API key authentication
export const updateRecordingStatus = mutation({
  args: {
    apiKey: v.string(),
    recordingId: v.id("meetingRecordings"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("joining"),
      v.literal("recording"),
      v.literal("processing"),
      v.literal("transcribing"),
      v.literal("summarizing"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("failed"),
    ),
    errorMessage: v.optional(v.string()),
    botJoinedAt: v.optional(v.number()),
    botLeftAt: v.optional(v.number()),
    actualStartTime: v.optional(v.number()),
    actualEndTime: v.optional(v.number()),
    duration: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

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

// Save transcript (called after transcription processing)
// Requires bot service API key authentication
export const saveTranscript = mutation({
  args: {
    apiKey: v.string(),
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
      }),
    ),
    language: v.string(),
    modelUsed: v.string(),
    processingTime: v.optional(v.number()),
    wordCount: v.number(),
    speakerCount: v.optional(v.number()),
  },
  returns: v.id("meetingTranscripts"),
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

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
// Requires bot service API key authentication
export const saveSummary = mutation({
  args: {
    apiKey: v.string(),
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
      }),
    ),
    decisions: v.array(v.string()),
    openQuestions: v.array(v.string()),
    topics: v.array(
      v.object({
        title: v.string(),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        summary: v.string(),
      }),
    ),
    overallSentiment: v.optional(
      v.union(
        v.literal("positive"),
        v.literal("neutral"),
        v.literal("negative"),
        v.literal("mixed"),
      ),
    ),
    modelUsed: v.string(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    processingTime: v.optional(v.number()),
  },
  returns: v.id("meetingSummaries"),
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

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
// Requires bot service API key authentication
export const saveParticipants = mutation({
  args: {
    apiKey: v.string(),
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
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw new Error("Recording not found");

    // Try to match participants to Nixelo users by email
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
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
      .collect();
    const nextNumber = existingIssues.length + 1;

    const now = Date.now();

    // Create the issue
    const issueId = await ctx.db.insert("issues", {
      projectId: args.projectId,
      workspaceId: project.workspaceId ?? ("" as Id<"workspaces">),
      teamId: project.teamId ?? ("" as Id<"teams">),
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
      loggedHours: 0,
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
      platform: recording.meetingPlatform,
    });
  },
});

// Notify bot service to start a job
export const notifyBotService = internalAction({
  args: {
    jobId: v.id("meetingBotJobs"),
    recordingId: v.id("meetingRecordings"),
    meetingUrl: v.string(),
    platform: v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("teams"),
      v.literal("other"),
    ),
  },
  handler: async (ctx, args) => {
    const botServiceUrl = getBotServiceUrl();
    const botServiceApiKey = getBotServiceApiKey();

    if (!(botServiceUrl && botServiceApiKey)) {
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
          Authorization: `Bearer ${botServiceApiKey}`,
        },
        body: JSON.stringify({
          jobId: args.jobId,
          recordingId: args.recordingId,
          meetingUrl: args.meetingUrl,
          platform: args.platform,
          botName: "Nixelo Notetaker",
          // Callback URLs for the bot to report status (must be Convex backend URL)
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
      await ctx.scheduler.runAt(new Date(nextAttempt), internal.meetingBot.triggerBotJob, {
        recordingId: args.recordingId,
      });
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
