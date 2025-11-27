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
