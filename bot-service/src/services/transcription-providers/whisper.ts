/**
 * OpenAI Whisper Transcription Provider
 *
 * Cost: $0.006/minute
 * Free tier: None
 * Docs: https://platform.openai.com/docs/api-reference/audio
 */

import OpenAI from "openai";
import * as fs from "fs";
import { retryApi } from "../../utils/retry.js";
import type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";

export class WhisperProvider implements TranscriptionProvider {
  readonly name = "whisper";
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  isConfigured(): boolean {
    return this.openai !== null;
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.openai) {
      throw new Error("Whisper provider not configured. Set OPENAI_API_KEY.");
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Get file stats for duration estimation
    const stats = fs.statSync(audioFilePath);
    const fileSizeBytes = stats.size;
    // Rough estimate: ~1MB per minute for audio
    const estimatedMinutes = fileSizeBytes / (1024 * 1024);

    const response = await retryApi(() =>
      this.openai!.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      })
    );

    const processingTime = Date.now() - startTime;

    const verboseResponse = response as OpenAI.Audio.Transcription & {
      segments?: Array<{
        start: number;
        end: number;
        text: string;
        avg_logprob?: number;
      }>;
      language?: string;
      duration?: number;
    };

    const fullText = verboseResponse.text;
    const segments: TranscriptSegment[] = (verboseResponse.segments || []).map((seg) => ({
      startTime: seg.start,
      endTime: seg.end,
      text: seg.text.trim(),
      confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : undefined,
    }));

    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;

    // Use actual duration from response if available
    const durationMinutes = verboseResponse.duration
      ? verboseResponse.duration / 60
      : estimatedMinutes;

    return {
      fullText,
      segments,
      language: verboseResponse.language || "en",
      modelUsed: "whisper-1",
      processingTime,
      wordCount,
      durationMinutes,
    };
  }
}
