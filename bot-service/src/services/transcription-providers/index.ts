/**
 * Transcription Provider Registry
 *
 * Exports all available transcription providers and helper functions.
 */

export type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";

export { WhisperProvider } from "./whisper.js";
export { SpeechmaticsProvider } from "./speechmatics.js";
export { GladiaProvider } from "./gladia.js";
export { AzureProvider } from "./azure.js";
export { AssemblyAIProvider } from "./assemblyai.js";
export { DeepgramProvider } from "./deepgram.js";
export { GoogleCloudSTTProvider } from "./google.js";

import type { TranscriptionProvider } from "./provider.js";
import { WhisperProvider } from "./whisper.js";
import { SpeechmaticsProvider } from "./speechmatics.js";
import { GladiaProvider } from "./gladia.js";
import { AzureProvider } from "./azure.js";
import { AssemblyAIProvider } from "./assemblyai.js";
import { DeepgramProvider } from "./deepgram.js";
import { GoogleCloudSTTProvider } from "./google.js";

/**
 * Get a provider instance by name
 */
export function getProvider(name: string): TranscriptionProvider | null {
  const providers: Record<string, () => TranscriptionProvider> = {
    whisper: () => new WhisperProvider(),
    speechmatics: () => new SpeechmaticsProvider(),
    gladia: () => new GladiaProvider(),
    azure: () => new AzureProvider(),
    assemblyai: () => new AssemblyAIProvider(),
    deepgram: () => new DeepgramProvider(),
    google: () => new GoogleCloudSTTProvider(),
  };

  const factory = providers[name.toLowerCase()];
  return factory ? factory() : null;
}

/**
 * Get all configured providers (only monthly-reset free tier providers)
 */
export function getConfiguredProviders(): TranscriptionProvider[] {
  // Only include providers with permanent monthly-reset free tiers
  const monthlyResetProviders = [
    new SpeechmaticsProvider(), // 8 hrs/month
    new GladiaProvider(), // 8 hrs/month
    new AzureProvider(), // 5 hrs/month
    new GoogleCloudSTTProvider(), // 1 hr/month
  ];

  return monthlyResetProviders.filter((p) => p.isConfigured());
}

/**
 * Provider names in priority order
 *
 * ONLY includes providers with PERMANENT monthly-reset free tiers.
 * One-time credit providers are excluded from rotation.
 * See docs/service-providers-research.md for full analysis.
 *
 * Total free capacity: 22 hours/month (8 + 8 + 5 + 1)
 */
export const PROVIDER_PRIORITY = [
  "speechmatics", // 8 hrs/month free (monthly reset)
  "gladia", // 8 hrs/month free (monthly reset)
  "azure", // 5 hrs/month free (monthly reset)
  "google", // 1 hr/month free (monthly reset)
  // NOTE: assemblyai excluded - 100 hrs one-time only
  // NOTE: deepgram excluded - $200 one-time only
  // NOTE: whisper excluded - no free tier
] as const;

export type ProviderName = (typeof PROVIDER_PRIORITY)[number];
