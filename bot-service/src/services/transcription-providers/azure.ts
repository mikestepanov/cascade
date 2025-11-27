/**
 * Azure Speech-to-Text Provider
 *
 * Cost: ~$0.017/minute (standard)
 * Free tier: 5 hours/month (300 minutes)
 * Docs: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/
 */

import * as fs from "fs";
import { retryApi } from "../../utils/retry.js";
import type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";

interface AzureRecognizedPhrase {
  recognitionStatus: string;
  offset: string; // Duration format: "PT0.00S"
  duration: string;
  nBest: Array<{
    confidence: number;
    display: string;
    lexical: string;
    itn: string;
    maskedITN: string;
    words?: Array<{
      word: string;
      offset: string;
      duration: string;
      confidence: number;
    }>;
  }>;
}

interface AzureResult {
  source: string;
  timestamp: string;
  durationInTicks: number;
  duration: string;
  combinedRecognizedPhrases: Array<{
    channel: number;
    lexical: string;
    itn: string;
    maskedITN: string;
    display: string;
  }>;
  recognizedPhrases: AzureRecognizedPhrase[];
}

export class AzureProvider implements TranscriptionProvider {
  readonly name = "azure";
  private subscriptionKey: string | null = null;
  private region: string;

  constructor() {
    this.subscriptionKey = process.env.AZURE_SPEECH_KEY || null;
    this.region = process.env.AZURE_SPEECH_REGION || "eastus";
  }

  isConfigured(): boolean {
    return this.subscriptionKey !== null;
  }

  // Parse Azure duration format (e.g., "PT5.24S") to seconds
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+(?:\.\d+)?)S/);
    return match ? parseFloat(match[1]) : 0;
  }

  // Get content type based on file extension
  private getContentType(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      wav: "audio/wav",
      webm: "audio/webm",
      ogg: "audio/ogg",
      mp3: "audio/mpeg",
      mp4: "audio/mp4",
      m4a: "audio/mp4",
      flac: "audio/flac",
    };
    return contentTypes[ext || ""] || "audio/webm";
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.subscriptionKey) {
      throw new Error("Azure Speech provider not configured. Set AZURE_SPEECH_KEY.");
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Read audio file
    const audioBuffer = fs.readFileSync(audioFilePath);
    const fileSizeKB = audioBuffer.length / 1024;

    // Azure REST API supports files up to 60 seconds for simple recognition
    // For longer files, we'll process in chunks using the real-time API
    const baseUrl = `https://${this.region}.stt.speech.microsoft.com`;

    // Use the REST API for recognition
    // This accepts audio data directly without needing blob storage
    const response = await retryApi(async () => {
      const res = await fetch(
        `${baseUrl}/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": this.subscriptionKey!,
            "Content-Type": this.getContentType(audioFilePath),
            Accept: "application/json",
          },
          body: audioBuffer,
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Azure transcription failed: ${res.status} ${errorText}`);
      }

      return res.json();
    });

    // Process Azure response
    const result = response as AzureResult;

    const processingTime = Date.now() - startTime;

    // Build results
    const fullText =
      result.combinedRecognizedPhrases?.[0]?.display ||
      result.recognizedPhrases.map((p) => p.nBest[0]?.display || "").join(" ");

    const segments: TranscriptSegment[] = result.recognizedPhrases.map((phrase) => {
      const best = phrase.nBest[0];
      const offsetSeconds = this.parseDuration(phrase.offset);
      const durationSeconds = this.parseDuration(phrase.duration);

      return {
        startTime: offsetSeconds,
        endTime: offsetSeconds + durationSeconds,
        text: best?.display || "",
        confidence: best?.confidence,
      };
    });

    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;
    const durationMinutes = this.parseDuration(result.duration) / 60;

    return {
      fullText,
      segments,
      language: "en",
      modelUsed: "azure-speech",
      processingTime,
      wordCount,
      durationMinutes,
    };
  }
}
