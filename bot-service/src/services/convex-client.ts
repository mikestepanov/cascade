import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex-api.js";
import type { MeetingSummary } from "./summary.js";
import type { TranscriptionResult } from "./transcription.js";

/**
 * Client for communicating with the Convex backend
 * Uses ConvexHttpClient for proper mutation calls with API key authentication
 */
export class ConvexClient {
  private client: ConvexHttpClient;
  private apiKey: string;

  constructor() {
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      throw new Error("CONVEX_URL environment variable not set");
    }

    this.apiKey = process.env.BOT_SERVICE_API_KEY || "";
    if (!this.apiKey) {
      // API key not set - will fail on first mutation attempt
    }

    this.client = new ConvexHttpClient(convexUrl);
  }

  async updateRecordingStatus(
    recordingId: string,
    status: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    await this.client.mutation(api.meetingBot.updateRecordingStatus, {
      apiKey: this.apiKey,
      recordingId,
      status,
      ...data,
    });
  }

  async saveTranscript(recordingId: string, transcription: TranscriptionResult): Promise<string> {
    const result = await this.client.mutation(api.meetingBot.saveTranscript, {
      apiKey: this.apiKey,
      recordingId,
      fullText: transcription.fullText,
      segments: transcription.segments.map((seg) => ({
        startTime: seg.startTime,
        endTime: seg.endTime,
        speaker: seg.speaker,
        text: seg.text,
        confidence: seg.confidence,
      })),
      language: transcription.language,
      modelUsed: transcription.modelUsed,
      processingTime: transcription.processingTime,
      wordCount: transcription.wordCount,
      speakerCount: transcription.speakerCount,
    });

    return result as string;
  }

  async saveSummary(
    recordingId: string,
    transcriptId: string,
    summary: MeetingSummary,
  ): Promise<string> {
    const result = await this.client.mutation(api.meetingBot.saveSummary, {
      apiKey: this.apiKey,
      recordingId,
      transcriptId,
      executiveSummary: summary.executiveSummary,
      keyPoints: summary.keyPoints,
      actionItems: summary.actionItems.map((item) => ({
        description: item.description,
        assignee: item.assignee,
        dueDate: item.dueDate,
        priority: item.priority,
      })),
      decisions: summary.decisions,
      openQuestions: summary.openQuestions,
      topics: summary.topics.map((topic) => ({
        title: topic.title,
        startTime: topic.startTime,
        endTime: topic.endTime,
        summary: topic.summary,
      })),
      overallSentiment: summary.overallSentiment,
      modelUsed: summary.modelUsed,
      promptTokens: summary.promptTokens,
      completionTokens: summary.completionTokens,
      processingTime: summary.processingTime,
    });

    return result as string;
  }

  async saveParticipants(
    recordingId: string,
    participants: Array<{
      displayName: string;
      email?: string;
      isHost: boolean;
    }>,
  ): Promise<void> {
    await this.client.mutation(api.meetingBot.saveParticipants, {
      apiKey: this.apiKey,
      recordingId,
      participants: participants.map((p) => ({
        displayName: p.displayName,
        email: p.email,
        isHost: p.isHost,
        isExternal: true, // Will be updated when matched to users
      })),
    });
  }

  async getPendingJobs() {
    return this.client.query(api.meetingBot.getPendingJobs, {
      apiKey: this.apiKey,
    });
  }
}
