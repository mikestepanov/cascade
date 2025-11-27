import OpenAI from "openai";
import * as fs from "fs";

export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  speaker?: string;
  text: string;
  confidence?: number;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
  modelUsed: string;
  processingTime: number;
  wordCount: number;
  speakerCount?: number;
}

export class TranscriptionService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      // Use Whisper API with verbose output for timestamps
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      });

      const processingTime = Date.now() - startTime;

      // Parse the response
      const verboseResponse = response as OpenAI.Audio.Transcription & {
        segments?: Array<{
          start: number;
          end: number;
          text: string;
          avg_logprob?: number;
        }>;
        language?: string;
      };

      const fullText = verboseResponse.text;
      const segments: TranscriptSegment[] = (verboseResponse.segments || []).map((seg) => ({
        startTime: seg.start,
        endTime: seg.end,
        text: seg.text.trim(),
        confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : undefined,
      }));

      // Count words
      const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;

      return {
        fullText,
        segments,
        language: verboseResponse.language || "en",
        modelUsed: "whisper-1",
        processingTime,
        wordCount,
      };
    } catch (error) {
      console.error("Transcription failed:", error);
      throw new Error(`Transcription failed: ${(error as Error).message}`);
    }
  }

  // For testing without actual audio file
  async transcribeFromText(text: string): Promise<TranscriptionResult> {
    const words = text.split(/\s+/);
    const wordsPerSecond = 2.5; // Average speaking rate

    const segments: TranscriptSegment[] = [];
    let currentStart = 0;

    // Create fake segments of ~30 words each
    for (let i = 0; i < words.length; i += 30) {
      const segmentWords = words.slice(i, i + 30);
      const duration = segmentWords.length / wordsPerSecond;

      segments.push({
        startTime: currentStart,
        endTime: currentStart + duration,
        text: segmentWords.join(" "),
      });

      currentStart += duration;
    }

    return {
      fullText: text,
      segments,
      language: "en",
      modelUsed: "mock",
      processingTime: 0,
      wordCount: words.length,
    };
  }
}
