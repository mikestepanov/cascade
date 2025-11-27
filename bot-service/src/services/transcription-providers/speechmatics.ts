/**
 * Speechmatics Transcription Provider
 *
 * Cost: ~$0.005/minute
 * Free tier: 8 hours/month (480 minutes)
 * Docs: https://docs.speechmatics.com/
 */

import * as fs from "fs";
import { retryApi } from "../../utils/retry.js";
import type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";

interface SpeechmaticsWord {
  content: string;
  start_time: number;
  end_time: number;
  confidence: number;
  type: "word" | "punctuation";
}

interface SpeechmaticsResult {
  results: Array<{
    alternatives: Array<{
      content: string;
      confidence: number;
      words: SpeechmaticsWord[];
    }>;
    start_time: number;
    end_time: number;
    type: "word" | "punctuation";
  }>;
  metadata: {
    transcription_config: {
      language: string;
    };
    created_at: string;
    duration: number;
  };
}

export class SpeechmaticsProvider implements TranscriptionProvider {
  readonly name = "speechmatics";
  private apiKey: string | null = null;
  private baseUrl = "https://asr.api.speechmatics.com/v2";

  constructor() {
    this.apiKey = process.env.SPEECHMATICS_API_KEY || null;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("Speechmatics provider not configured. Set SPEECHMATICS_API_KEY.");
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Create job
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(audioFilePath);
    const blob = new Blob([fileBuffer]);
    formData.append("data_file", blob, "audio.webm");
    formData.append(
      "config",
      JSON.stringify({
        type: "transcription",
        transcription_config: {
          operating_point: "enhanced",
          language: "en",
        },
      })
    );

    const createResponse = await retryApi(async () => {
      const res = await fetch(`${this.baseUrl}/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Speechmatics job creation failed: ${res.status} ${await res.text()}`);
      }

      return res.json() as Promise<{ id: string }>;
    });

    const jobId = createResponse.id;

    // Poll for completion
    let result: SpeechmaticsResult | null = null;
    const maxWaitMs = 600000; // 10 minutes
    const pollIntervalMs = 2000;
    const startPoll = Date.now();

    while (Date.now() - startPoll < maxWaitMs) {
      const statusResponse = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const status = (await statusResponse.json()) as { job: { status: string } };

      if (status.job.status === "done") {
        // Get transcript
        const transcriptResponse = await fetch(`${this.baseUrl}/jobs/${jobId}/transcript?format=json-v2`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        });
        result = (await transcriptResponse.json()) as SpeechmaticsResult;
        break;
      } else if (status.job.status === "rejected" || status.job.status === "deleted") {
        throw new Error(`Speechmatics job failed: ${status.job.status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (!result) {
      throw new Error("Speechmatics transcription timed out");
    }

    const processingTime = Date.now() - startTime;

    // Build full text and segments
    const words: SpeechmaticsWord[] = [];
    for (const r of result.results) {
      if (r.alternatives && r.alternatives[0]?.words) {
        words.push(...r.alternatives[0].words);
      }
    }

    const fullText = words
      .map((w) => w.content)
      .join("")
      .replace(/\s+/g, " ")
      .trim();

    // Group words into segments (~30 second chunks)
    const segments: TranscriptSegment[] = [];
    let currentSegment: TranscriptSegment | null = null;
    const segmentDuration = 30;

    for (const word of words) {
      if (word.type === "punctuation") continue;

      if (!currentSegment || word.start_time - currentSegment.startTime >= segmentDuration) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          startTime: word.start_time,
          endTime: word.end_time,
          text: word.content,
          confidence: word.confidence,
        };
      } else {
        currentSegment.endTime = word.end_time;
        currentSegment.text += " " + word.content;
        if (currentSegment.confidence && word.confidence) {
          currentSegment.confidence = (currentSegment.confidence + word.confidence) / 2;
        }
      }
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;
    const durationMinutes = result.metadata.duration / 60;

    return {
      fullText,
      segments,
      language: result.metadata.transcription_config.language || "en",
      modelUsed: "speechmatics-enhanced",
      processingTime,
      wordCount,
      durationMinutes,
    };
  }
}
