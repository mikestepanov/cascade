import type { TranscriptionResult } from "./transcription.js";
import type { MeetingSummary } from "./summary.js";

/**
 * Client for communicating with the Convex backend
 * Makes HTTP requests to Convex mutations
 */
export class ConvexClient {
  private convexUrl: string;

  constructor() {
    this.convexUrl = process.env.CONVEX_URL || "";
    if (!this.convexUrl) {
      console.warn("CONVEX_URL not configured");
    }
  }

  private async callMutation(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.convexUrl) {
      console.error("CONVEX_URL not configured, skipping mutation:", name);
      return null;
    }

    try {
      const response = await fetch(`${this.convexUrl}/api/mutation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: name,
          args,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Convex mutation failed: ${error}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Failed to call Convex mutation ${name}:`, error);
      throw error;
    }
  }

  async updateRecordingStatus(
    recordingId: string,
    status: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    await this.callMutation("meetingBot:updateRecordingStatus", {
      recordingId,
      status,
      ...data,
    });
  }

  async saveTranscript(
    recordingId: string,
    transcription: TranscriptionResult
  ): Promise<string> {
    const result = await this.callMutation("meetingBot:saveTranscript", {
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
    summary: MeetingSummary
  ): Promise<string> {
    const result = await this.callMutation("meetingBot:saveSummary", {
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
    }>
  ): Promise<void> {
    await this.callMutation("meetingBot:saveParticipants", {
      recordingId,
      participants: participants.map((p) => ({
        displayName: p.displayName,
        email: p.email,
        isHost: p.isHost,
        isExternal: true, // Will be updated when matched to users
      })),
    });
  }
}
