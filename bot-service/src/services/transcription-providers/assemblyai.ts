/**
 * AssemblyAI Transcription Provider
 *
 * Cost: ~$0.0025/minute
 * Free tier: 100 hours one-time credit (6000 minutes)
 * Docs: https://www.assemblyai.com/docs
 */

import * as fs from "fs";
import { retryApi } from "../../utils/retry.js";
import type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";

interface AssemblyAIWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

interface AssemblyAIUtterance {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string;
  words: AssemblyAIWord[];
}

interface AssemblyAIResult {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string;
  words: AssemblyAIWord[];
  utterances?: AssemblyAIUtterance[];
  audio_duration: number;
  language_code: string;
  error?: string;
}

export class AssemblyAIProvider implements TranscriptionProvider {
  readonly name = "assemblyai";
  private apiKey: string | null = null;
  private baseUrl = "https://api.assemblyai.com/v2";

  constructor() {
    this.apiKey = process.env.ASSEMBLYAI_API_KEY || null;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("AssemblyAI provider not configured. Set ASSEMBLYAI_API_KEY.");
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Upload file
    const fileBuffer = fs.readFileSync(audioFilePath);

    const uploadResponse = await retryApi(async () => {
      const res = await fetch(`${this.baseUrl}/upload`, {
        method: "POST",
        headers: {
          Authorization: this.apiKey!,
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
      });

      if (!res.ok) {
        throw new Error(`AssemblyAI upload failed: ${res.status} ${await res.text()}`);
      }

      return res.json() as Promise<{ upload_url: string }>;
    });

    // Create transcription
    const transcriptResponse = await retryApi(async () => {
      const res = await fetch(`${this.baseUrl}/transcript`, {
        method: "POST",
        headers: {
          Authorization: this.apiKey!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: uploadResponse.upload_url,
          speaker_labels: true,
          punctuate: true,
          format_text: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`AssemblyAI transcription request failed: ${res.status} ${await res.text()}`);
      }

      return res.json() as Promise<{ id: string }>;
    });

    // Poll for completion
    let result: AssemblyAIResult | null = null;
    const maxWaitMs = 600000;
    const pollIntervalMs = 3000;
    const startPoll = Date.now();

    while (Date.now() - startPoll < maxWaitMs) {
      const statusResponse = await fetch(`${this.baseUrl}/transcript/${transcriptResponse.id}`, {
        headers: {
          Authorization: this.apiKey!,
        },
      });

      const status = (await statusResponse.json()) as AssemblyAIResult;

      if (status.status === "completed") {
        result = status;
        break;
      } else if (status.status === "error") {
        throw new Error(`AssemblyAI transcription failed: ${status.error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (!result) {
      throw new Error("AssemblyAI transcription timed out");
    }

    const processingTime = Date.now() - startTime;

    // Build segments from utterances (speaker-aware) or words
    let segments: TranscriptSegment[];

    if (result.utterances && result.utterances.length > 0) {
      segments = result.utterances.map((u) => ({
        startTime: u.start / 1000, // Convert ms to seconds
        endTime: u.end / 1000,
        text: u.text,
        confidence: u.confidence,
        speaker: u.speaker,
      }));
    } else {
      // Group words into ~30 second segments
      segments = [];
      let currentSegment: TranscriptSegment | null = null;
      const segmentDuration = 30000; // 30 seconds in ms

      for (const word of result.words) {
        if (!currentSegment || word.start - currentSegment.startTime * 1000 >= segmentDuration) {
          if (currentSegment) {
            segments.push(currentSegment);
          }
          currentSegment = {
            startTime: word.start / 1000,
            endTime: word.end / 1000,
            text: word.text,
            confidence: word.confidence,
          };
        } else {
          currentSegment.endTime = word.end / 1000;
          currentSegment.text += " " + word.text;
        }
      }

      if (currentSegment) {
        segments.push(currentSegment);
      }
    }

    const fullText = result.text;
    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;
    const durationMinutes = result.audio_duration / 60;

    // Count unique speakers
    const speakers = new Set(result.utterances?.map((u) => u.speaker) || []);
    const speakerCount = speakers.size > 0 ? speakers.size : undefined;

    return {
      fullText,
      segments,
      language: result.language_code || "en",
      modelUsed: "assemblyai",
      processingTime,
      wordCount,
      durationMinutes,
      speakerCount,
    };
  }
}
