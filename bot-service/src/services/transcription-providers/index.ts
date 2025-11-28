/**
 * Transcription Provider Registry
 *
 * Exports all available transcription providers and helper functions.
 *
 * ONLY includes providers with PERMANENT monthly-reset free tiers:
 * - Speechmatics: 8 hrs/month
 * - Gladia: 8 hrs/month
 * - Azure: 5 hrs/month
 * - Google Cloud STT: 1 hr/month
 *
 * Total free capacity: 22 hours/month
 *
 * Excluded providers (one-time credits or no free tier):
 * - AssemblyAI: 100 hrs one-time only
 * - Deepgram: $200 one-time only
 * - OpenAI Whisper: no free tier
 *
 * See docs/service-providers-research.md for full analysis.
 */

export { AzureProvider } from "./azure.js";
export { GladiaProvider } from "./gladia.js";
export { GoogleCloudSTTProvider } from "./google.js";
export type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";
export { SpeechmaticsProvider } from "./speechmatics.js";

import { AzureProvider } from "./azure.js";
import { GladiaProvider } from "./gladia.js";
import { GoogleCloudSTTProvider } from "./google.js";
import type { TranscriptionProvider } from "./provider.js";
import { SpeechmaticsProvider } from "./speechmatics.js";

/**
 * Get a provider instance by name
 */
export function getProvider(name: string): TranscriptionProvider | null {
  const providers: Record<string, () => TranscriptionProvider> = {
    speechmatics: () => new SpeechmaticsProvider(),
    gladia: () => new GladiaProvider(),
    azure: () => new AzureProvider(),
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
 * Total free capacity: 22 hours/month (8 + 8 + 5 + 1)
 */
export const PROVIDER_PRIORITY = [
  "speechmatics", // 8 hrs/month
  "gladia", // 8 hrs/month
  "azure", // 5 hrs/month
  "google", // 1 hr/month
] as const;

export type ProviderName = (typeof PROVIDER_PRIORITY)[number];
