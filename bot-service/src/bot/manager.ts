import { v4 as uuidv4 } from "uuid";
import { GoogleMeetBot } from "./google-meet.js";
import { TranscriptionService } from "../services/transcription.js";
import { SummaryService } from "../services/summary.js";
import { ConvexClient } from "../services/convex-client.js";

export interface BotJob {
  id: string;
  recordingId: string;
  meetingUrl: string;
  platform: "google_meet" | "zoom" | "teams";
  botName: string;
  callbackUrl?: string;
  status: "pending" | "joining" | "recording" | "processing" | "completed" | "failed";
  error?: string;
  startedAt?: Date;
  endedAt?: Date;
  audioFilePath?: string;
}

export class MeetingBotManager {
  private jobs: Map<string, BotJob> = new Map();
  private activeBots: Map<string, GoogleMeetBot> = new Map();
  private transcriptionService: TranscriptionService;
  private summaryService: SummaryService;
  private convexClient: ConvexClient;

  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.summaryService = new SummaryService();
    this.convexClient = new ConvexClient();
  }

  async createJob(params: {
    jobId?: string;
    recordingId: string;
    meetingUrl: string;
    platform: string;
    botName: string;
    callbackUrl?: string;
  }): Promise<BotJob> {
    const job: BotJob = {
      id: params.jobId || uuidv4(),
      recordingId: params.recordingId,
      meetingUrl: params.meetingUrl,
      platform: params.platform as "google_meet" | "zoom" | "teams",
      botName: params.botName,
      callbackUrl: params.callbackUrl,
      status: "pending",
      startedAt: new Date(),
    };

    this.jobs.set(job.id, job);

    // Start the bot asynchronously
    this.runBot(job).catch((error) => {
      console.error(`Bot job ${job.id} failed:`, error);
      job.status = "failed";
      job.error = error.message;
    });

    return job;
  }

  private async runBot(job: BotJob): Promise<void> {
    try {
      // Update status to joining
      job.status = "joining";
      await this.reportStatus(job, "joining");

      // Create and start the bot based on platform
      if (job.platform === "google_meet") {
        const bot = new GoogleMeetBot({
          meetingUrl: job.meetingUrl,
          botName: job.botName,
          onStatusChange: (status, data) => this.handleBotStatusChange(job, status, data),
        });

        this.activeBots.set(job.id, bot);

        // Join the meeting
        await bot.join();

        // Update status to recording
        job.status = "recording";
        await this.reportStatus(job, "recording");

        // Wait for the meeting to end (bot will signal when done)
        const audioFilePath = await bot.waitForEnd();
        job.audioFilePath = audioFilePath;

        // Clean up bot
        this.activeBots.delete(job.id);

        // Process the recording
        await this.processRecording(job);
      } else {
        throw new Error(`Platform ${job.platform} not yet supported`);
      }
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Unknown error";
      job.endedAt = new Date();
      await this.reportStatus(job, "failed", { error: job.error });
      throw error;
    }
  }

  private async processRecording(job: BotJob): Promise<void> {
    if (!job.audioFilePath) {
      throw new Error("No audio file to process");
    }

    try {
      // Update status to processing
      job.status = "processing";
      await this.reportStatus(job, "processing");

      // Step 1: Transcribe with Whisper
      await this.reportStatus(job, "transcribing");
      const transcription = await this.transcriptionService.transcribe(job.audioFilePath);

      // Save transcript to Convex
      const transcriptId = await this.convexClient.saveTranscript(job.recordingId, transcription);

      // Step 2: Generate summary with Claude
      await this.reportStatus(job, "summarizing");
      const summary = await this.summaryService.summarize(transcription.fullText);

      // Save summary to Convex
      await this.convexClient.saveSummary(job.recordingId, transcriptId, summary);

      // Done!
      job.status = "completed";
      job.endedAt = new Date();
      await this.reportStatus(job, "completed");
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Processing failed";
      job.endedAt = new Date();
      await this.reportStatus(job, "failed", { error: job.error });
      throw error;
    }
  }

  private async handleBotStatusChange(
    job: BotJob,
    status: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    console.log(`Bot ${job.id} status changed to: ${status}`, data);

    // Update Convex with real-time status
    if (status === "joined") {
      await this.convexClient.updateRecordingStatus(job.recordingId, "recording", {
        botJoinedAt: Date.now(),
        actualStartTime: Date.now(),
      });
    } else if (status === "left" || status === "ended") {
      await this.convexClient.updateRecordingStatus(job.recordingId, "processing", {
        botLeftAt: Date.now(),
        actualEndTime: Date.now(),
      });
    } else if (status === "participants") {
      // Save participant data
      if (data?.participants) {
        await this.convexClient.saveParticipants(
          job.recordingId,
          data.participants as Array<{
            displayName: string;
            email?: string;
            isHost: boolean;
          }>
        );
      }
    }
  }

  private async reportStatus(
    job: BotJob,
    status: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    // Map internal status to Convex status
    const convexStatus = this.mapStatus(status);

    await this.convexClient.updateRecordingStatus(job.recordingId, convexStatus, data);
  }

  private mapStatus(
    status: string
  ): "scheduled" | "joining" | "recording" | "processing" | "transcribing" | "summarizing" | "completed" | "failed" {
    const statusMap: Record<string, typeof status> = {
      pending: "scheduled",
      joining: "joining",
      recording: "recording",
      processing: "processing",
      transcribing: "transcribing",
      summarizing: "summarizing",
      completed: "completed",
      failed: "failed",
    };
    return (statusMap[status] || "processing") as ReturnType<typeof this.mapStatus>;
  }

  getJob(jobId: string): BotJob | undefined {
    return this.jobs.get(jobId);
  }

  listJobs(): BotJob[] {
    return Array.from(this.jobs.values());
  }

  async stopJob(jobId: string): Promise<void> {
    const bot = this.activeBots.get(jobId);
    if (bot) {
      await bot.leave();
      this.activeBots.delete(jobId);
    }

    const job = this.jobs.get(jobId);
    if (job) {
      job.status = "failed";
      job.error = "Stopped by user";
      job.endedAt = new Date();
    }
  }

  async handleStatusUpdate(
    jobId: string,
    status: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    await this.handleBotStatusChange(job, status, data);
  }
}
