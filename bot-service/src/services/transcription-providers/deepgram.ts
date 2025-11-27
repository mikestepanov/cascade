/**
 * Deepgram Transcription Provider
 *
 * Cost: ~$0.0043/minute (Nova-2)
 * Free tier: $200 one-time credit (~775 hours)
 * Docs: https://developers.deepgram.com/
 */

import * as fs from "fs";
import { retryApi } from "../../utils/retry.js";
import type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

interface DeepgramUtterance {
  start: number;
  end: number;
  confidence: number;
  channel: number;
  transcript: string;
  words: DeepgramWord[];
  speaker?: number;
  id: string;
}

interface DeepgramResult {
  metadata: {
    request_id: string;
    created: string;
    duration: number;
    channels: number;
    models: string[];
  };
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: DeepgramWord[];
      }>;
      detected_language?: string;
    }>;
    utterances?: DeepgramUtterance[];
  };
}

export class DeepgramProvider implements TranscriptionProvider {
  readonly name = "deepgram";
  private apiKey: string | null = null;
  private baseUrl = "https://api.deepgram.com/v1";

  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY || null;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("Deepgram provider not configured. Set DEEPGRAM_API_KEY.");
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    const fileBuffer = fs.readFileSync(audioFilePath);

    // Deepgram is synchronous - returns result immediately
    const result = await retryApi(async () => {
      const res = await fetch(
        `${this.baseUrl}/listen?model=nova-2&punctuate=true&diarize=true&utterances=true&smart_format=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${this.apiKey}`,
            "Content-Type": "audio/webm", // Adjust based on actual file type
          },
          body: fileBuffer,
        }
      );

      if (!res.ok) {
        throw new Error(`Deepgram transcription failed: ${res.status} ${await res.text()}`);
      }

      return res.json() as Promise<DeepgramResult>;
    });

    const processingTime = Date.now() - startTime;

    // Get best alternative from first channel
    const channel = result.results.channels[0];
    const alternative = channel?.alternatives[0];

    if (!alternative) {
      throw new Error("Deepgram returned no transcription");
    }

    const fullText = alternative.transcript;

    // Build segments from utterances (speaker-aware) or words
    let segments: TranscriptSegment[];

    if (result.results.utterances && result.results.utterances.length > 0) {
      segments = result.results.utterances.map((u) => ({
        startTime: u.start,
        endTime: u.end,
        text: u.transcript,
        confidence: u.confidence,
        speaker: u.speaker !== undefined ? `Speaker ${u.speaker}` : undefined,
      }));
    } else {
      // Group words into ~30 second segments
      segments = [];
      let currentSegment: TranscriptSegment | null = null;
      const segmentDuration = 30;

      for (const word of alternative.words) {
        if (!currentSegment || word.start - currentSegment.startTime >= segmentDuration) {
          if (currentSegment) {
            segments.push(currentSegment);
          }
          currentSegment = {
            startTime: word.start,
            endTime: word.end,
            text: word.punctuated_word || word.word,
            confidence: word.confidence,
          };
        } else {
          currentSegment.endTime = word.end;
          currentSegment.text += " " + (word.punctuated_word || word.word);
        }
      }

      if (currentSegment) {
        segments.push(currentSegment);
      }
    }

    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;
    const durationMinutes = result.metadata.duration / 60;

    // Count unique speakers
    const speakers = new Set(
      result.results.utterances?.map((u) => u.speaker).filter((s) => s !== undefined) || []
    );
    const speakerCount = speakers.size > 0 ? speakers.size : undefined;

    return {
      fullText,
      segments,
      language: channel?.detected_language || "en",
      modelUsed: "deepgram-nova-2",
      processingTime,
      wordCount,
      durationMinutes,
      speakerCount,
    };
  }
}
