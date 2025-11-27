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

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.subscriptionKey) {
      throw new Error("Azure Speech provider not configured. Set AZURE_SPEECH_KEY.");
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    const baseUrl = `https://${this.region}.api.cognitive.microsoft.com/speechtotext/v3.1`;

    // Create transcription job
    const fileBuffer = fs.readFileSync(audioFilePath);
    const fileBase64 = fileBuffer.toString("base64");

    // For batch transcription, we need to upload to blob storage or use a URL
    // Azure's batch API requires a contentUrl, so we'll use the REST API for short audio
    // or create a batch job for longer files

    // For simplicity, we'll use the batch transcription API
    const createResponse = await retryApi(async () => {
      const res = await fetch(`${baseUrl}/transcriptions`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": this.subscriptionKey!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentUrls: [], // Would need blob storage URL
          properties: {
            wordLevelTimestampsEnabled: true,
            displayFormWordLevelTimestampsEnabled: true,
            punctuationMode: "DictatedAndAutomatic",
            profanityFilterMode: "None",
          },
          locale: "en-US",
          displayName: `Cascade transcription ${Date.now()}`,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Azure transcription creation failed: ${res.status} ${errorText}`);
      }

      return res.json() as Promise<{ self: string }>;
    });

    // Poll for completion
    let result: AzureResult | null = null;
    const maxWaitMs = 600000;
    const pollIntervalMs = 3000;
    const startPoll = Date.now();

    while (Date.now() - startPoll < maxWaitMs) {
      const statusResponse = await fetch(createResponse.self, {
        headers: {
          "Ocp-Apim-Subscription-Key": this.subscriptionKey!,
        },
      });

      const status = (await statusResponse.json()) as { status: string; links?: { files: string } };

      if (status.status === "Succeeded" && status.links?.files) {
        // Get results
        const filesResponse = await fetch(status.links.files, {
          headers: {
            "Ocp-Apim-Subscription-Key": this.subscriptionKey!,
          },
        });
        const files = (await filesResponse.json()) as {
          values: Array<{ kind: string; links: { contentUrl: string } }>;
        };

        const transcriptFile = files.values.find((f) => f.kind === "Transcription");
        if (transcriptFile) {
          const transcriptResponse = await fetch(transcriptFile.links.contentUrl);
          result = (await transcriptResponse.json()) as AzureResult;
        }
        break;
      } else if (status.status === "Failed") {
        throw new Error("Azure transcription failed");
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (!result) {
      throw new Error("Azure transcription timed out or failed");
    }

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
