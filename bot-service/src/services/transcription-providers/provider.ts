/**
 * Transcription Provider Interface
 *
 * Abstraction for switching between transcription services.
 * Supports: Whisper, Speechmatics, Gladia, Azure, AssemblyAI, Deepgram
 */

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
  durationMinutes: number; // For billing
}

export interface TranscriptionProvider {
  /**
   * Provider identifier
   */
  readonly name: string;

  /**
   * Transcribe an audio file
   */
  transcribe(audioFilePath: string): Promise<TranscriptionResult>;

  /**
   * Check if provider is configured (has API key)
   */
  isConfigured(): boolean;
}

/**
 * Audio MIME type mapping by file extension
 */
const AUDIO_CONTENT_TYPES: Record<string, string> = {
  wav: "audio/wav",
  webm: "audio/webm",
  ogg: "audio/ogg",
  mp3: "audio/mpeg",
  mp4: "audio/mp4",
  m4a: "audio/mp4",
  flac: "audio/flac",
  aac: "audio/aac",
};

/**
 * Get MIME type for an audio file based on extension
 */
export function getAudioContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return AUDIO_CONTENT_TYPES[ext] || "audio/webm";
}

/**
 * Get file extension from a MIME type
 */
export function getExtensionFromContentType(contentType: string): string {
  const entry = Object.entries(AUDIO_CONTENT_TYPES).find(
    ([, mime]) => mime === contentType
  );
  return entry ? entry[0] : "webm";
}
