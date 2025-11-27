/**
 * Google Cloud Speech-to-Text Provider
 *
 * Cost: $0.024/minute ($1.44/hour) - Standard
 * Free tier: 60 minutes/month (1 hour)
 * Docs: https://cloud.google.com/speech-to-text/docs
 */

import * as fs from "fs";
import { retryApi } from "../../utils/retry.js";
import type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";

interface GoogleWord {
  startTime: string; // e.g., "1.500s"
  endTime: string;
  word: string;
  confidence?: number;
  speakerTag?: number;
}

interface GoogleAlternative {
  transcript: string;
  confidence: number;
  words?: GoogleWord[];
}

interface GoogleResult {
  alternatives: GoogleAlternative[];
  channelTag?: number;
  languageCode?: string;
}

interface GoogleResponse {
  results: GoogleResult[];
  totalBilledTime?: string;
}

interface GoogleOperation {
  name: string;
  done: boolean;
  response?: GoogleResponse;
  error?: { code: number; message: string };
}

export class GoogleCloudSTTProvider implements TranscriptionProvider {
  readonly name = "google";
  private apiKey: string | null = null;
  private projectId: string | null = null;
  private baseUrl = "https://speech.googleapis.com/v1";

  constructor() {
    this.apiKey = process.env.GOOGLE_CLOUD_API_KEY || null;
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || null;
  }

  isConfigured(): boolean {
    // Can use either API key or project ID with default credentials
    return this.apiKey !== null || this.projectId !== null;
  }

  // Parse Google duration format (e.g., "1.500s") to seconds
  private parseDuration(duration: string): number {
    if (!duration) return 0;
    const match = duration.match(/^(\d+(?:\.\d+)?)s$/);
    return match ? parseFloat(match[1]) : 0;
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.isConfigured()) {
      throw new Error(
        "Google Cloud STT provider not configured. Set GOOGLE_CLOUD_API_KEY or GOOGLE_CLOUD_PROJECT_ID."
      );
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    const fileBuffer = fs.readFileSync(audioFilePath);
    const audioContent = fileBuffer.toString("base64");

    // For files under 1 minute, use synchronous recognition
    // For longer files, use async (longrunningrecognize)
    const fileSizeBytes = fileBuffer.length;
    const estimatedMinutes = fileSizeBytes / (1024 * 1024); // Rough: 1MB per minute

    const useAsync = estimatedMinutes > 1;

    const requestBody = {
      config: {
        encoding: "WEBM_OPUS", // Adjust based on your audio format
        sampleRateHertz: 48000,
        languageCode: "en-US",
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
        enableSpeakerDiarization: true,
        diarizationSpeakerCount: 2, // Adjust as needed
        model: "latest_long", // Best for long-form audio
      },
      audio: {
        content: audioContent,
      },
    };

    const authParam = this.apiKey ? `?key=${this.apiKey}` : "";

    let result: GoogleResponse;

    if (useAsync) {
      // Long-running recognition for files > 1 minute
      const operationResponse = await retryApi(async () => {
        const res = await fetch(`${this.baseUrl}/speech:longrunningrecognize${authParam}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          throw new Error(`Google Cloud STT request failed: ${res.status} ${await res.text()}`);
        }

        return res.json() as Promise<{ name: string }>;
      });

      // Poll for completion
      const maxWaitMs = 600000;
      const pollIntervalMs = 3000;
      const startPoll = Date.now();

      while (Date.now() - startPoll < maxWaitMs) {
        const statusResponse = await fetch(
          `https://speech.googleapis.com/v1/operations/${operationResponse.name}${authParam}`
        );

        const operation = (await statusResponse.json()) as GoogleOperation;

        if (operation.done) {
          if (operation.error) {
            throw new Error(`Google Cloud STT failed: ${operation.error.message}`);
          }
          result = operation.response!;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }

      if (!result!) {
        throw new Error("Google Cloud STT transcription timed out");
      }
    } else {
      // Synchronous recognition for short files
      result = await retryApi(async () => {
        const res = await fetch(`${this.baseUrl}/speech:recognize${authParam}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          throw new Error(`Google Cloud STT request failed: ${res.status} ${await res.text()}`);
        }

        return res.json() as Promise<GoogleResponse>;
      });
    }

    const processingTime = Date.now() - startTime;

    // Build full text and segments
    let fullText = "";
    const segments: TranscriptSegment[] = [];

    for (const resultItem of result.results || []) {
      const alternative = resultItem.alternatives[0];
      if (!alternative) continue;

      fullText += (fullText ? " " : "") + alternative.transcript;

      // Build segment from words or use the whole alternative
      if (alternative.words && alternative.words.length > 0) {
        // Group words into ~30 second segments
        let currentSegment: TranscriptSegment | null = null;
        const segmentDuration = 30;

        for (const word of alternative.words) {
          const wordStart = this.parseDuration(word.startTime);
          const wordEnd = this.parseDuration(word.endTime);

          if (!currentSegment || wordStart - currentSegment.startTime >= segmentDuration) {
            if (currentSegment) {
              segments.push(currentSegment);
            }
            currentSegment = {
              startTime: wordStart,
              endTime: wordEnd,
              text: word.word,
              confidence: word.confidence,
              speaker: word.speakerTag ? `Speaker ${word.speakerTag}` : undefined,
            };
          } else {
            currentSegment.endTime = wordEnd;
            currentSegment.text += " " + word.word;
          }
        }

        if (currentSegment) {
          segments.push(currentSegment);
        }
      } else {
        // No word-level timing, use the whole result as one segment
        segments.push({
          startTime: 0,
          endTime: 0,
          text: alternative.transcript,
          confidence: alternative.confidence,
        });
      }
    }

    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;

    // Calculate duration from billed time or estimate
    let durationMinutes = estimatedMinutes;
    if (result.totalBilledTime) {
      durationMinutes = this.parseDuration(result.totalBilledTime) / 60;
    } else if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      durationMinutes = lastSegment.endTime / 60;
    }

    // Count unique speakers
    const speakers = new Set(segments.map((s) => s.speaker).filter(Boolean));
    const speakerCount = speakers.size > 0 ? speakers.size : undefined;

    return {
      fullText,
      segments,
      language: result.results?.[0]?.languageCode || "en-US",
      modelUsed: "google-cloud-stt",
      processingTime,
      wordCount,
      durationMinutes,
      speakerCount,
    };
  }
}
