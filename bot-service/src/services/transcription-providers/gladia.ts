/**
 * Gladia Transcription Provider
 *
 * Cost: ~$0.005/minute
 * Free tier: 8 hours/month (480 minutes)
 * Docs: https://docs.gladia.io/
 */

import * as fs from "node:fs";
import { retryApi } from "../../utils/retry.js";
import type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";

interface GladiaUtterance {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

interface GladiaResult {
  result: {
    transcription: {
      full_transcript: string;
      utterances: GladiaUtterance[];
      languages: string[];
    };
    metadata: {
      audio_duration: number;
      billing_time: number;
    };
  };
}

export class GladiaProvider implements TranscriptionProvider {
  readonly name = "gladia";
  private apiKey: string | null = null;
  private baseUrl = "https://api.gladia.io/v2";

  constructor() {
    this.apiKey = process.env.GLADIA_API_KEY || null;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("Gladia provider not configured. Set GLADIA_API_KEY.");
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Upload file first
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(audioFilePath);
    const blob = new Blob([fileBuffer]);
    formData.append("audio", blob, "audio.webm");

    const uploadResponse = await retryApi(async () => {
      const res = await fetch(`${this.baseUrl}/upload`, {
        method: "POST",
        headers: {
          "x-gladia-key": this.apiKey!,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Gladia upload failed: ${res.status} ${await res.text()}`);
      }

      return res.json() as Promise<{ audio_url: string }>;
    });

    // Start transcription
    const transcriptResponse = await retryApi(async () => {
      const res = await fetch(`${this.baseUrl}/transcription`, {
        method: "POST",
        headers: {
          "x-gladia-key": this.apiKey!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: uploadResponse.audio_url,
          diarization: true,
          language_behaviour: "automatic single language",
        }),
      });

      if (!res.ok) {
        throw new Error(`Gladia transcription request failed: ${res.status} ${await res.text()}`);
      }

      return res.json() as Promise<{ id: string; result_url: string }>;
    });

    // Poll for completion
    let result: GladiaResult | null = null;
    const maxWaitMs = 600000; // 10 minutes
    const pollIntervalMs = 2000;
    const startPoll = Date.now();

    while (Date.now() - startPoll < maxWaitMs) {
      const statusResponse = await fetch(transcriptResponse.result_url, {
        headers: {
          "x-gladia-key": this.apiKey!,
        },
      });

      const status = (await statusResponse.json()) as { status: string } & GladiaResult;

      if (status.status === "done") {
        result = status;
        break;
      } else if (status.status === "error") {
        throw new Error("Gladia transcription failed");
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (!result) {
      throw new Error("Gladia transcription timed out");
    }

    const processingTime = Date.now() - startTime;

    const fullText = result.result.transcription.full_transcript;
    const segments: TranscriptSegment[] = result.result.transcription.utterances.map((u) => ({
      startTime: u.start,
      endTime: u.end,
      text: u.text,
      confidence: u.confidence,
      speaker: u.speaker !== undefined ? `Speaker ${u.speaker}` : undefined,
    }));

    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;
    const durationMinutes = result.result.metadata.audio_duration / 60;

    // Count unique speakers
    const speakers = new Set(result.result.transcription.utterances.map((u) => u.speaker));
    const speakerCount = speakers.size > 0 ? speakers.size : undefined;

    return {
      fullText,
      segments,
      language: result.result.transcription.languages[0] || "en",
      modelUsed: "gladia",
      processingTime,
      wordCount,
      durationMinutes,
      speakerCount,
    };
  }
}
