import { chromium, type Browser, type Page, type BrowserContext } from "playwright";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

export interface GoogleMeetBotOptions {
  meetingUrl: string;
  botName: string;
  onStatusChange?: (status: string, data?: Record<string, unknown>) => void;
}

export class GoogleMeetBot {
  private options: GoogleMeetBotOptions;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isRecording = false;
  private audioFilePath: string | null = null;
  private audioFileStream: fs.WriteStream | null = null;
  private endPromiseResolve: ((audioPath: string) => void) | null = null;

  constructor(options: GoogleMeetBotOptions) {
    this.options = options;
  }

  async join(): Promise<void> {
    try {
      // Launch browser with audio capture enabled
      // SECURITY NOTE: The flags below disable browser security features.
      // This is REQUIRED for the bot to join Google Meet and capture audio:
      // - disable-web-security: Allows cross-origin access to media streams
      // - IsolateOrigins/site-per-process: Required for audio element access
      // This bot runs in an isolated container (Railway) and only visits trusted
      // meeting URLs. Never expose this service directly to the internet.
      this.browser = await chromium.launch({
        headless: true, // Set to false for debugging
        args: [
          "--use-fake-ui-for-media-stream", // Auto-accept media permissions
          "--use-fake-device-for-media-stream", // Use fake devices
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          "--autoplay-policy=no-user-gesture-required",
        ],
      });

      this.context = await this.browser.newContext({
        permissions: ["microphone", "camera"],
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });

      this.page = await this.context.newPage();

      // Navigate to the meeting
      this.emitStatus("navigating");
      await this.page.goto(this.options.meetingUrl, { waitUntil: "networkidle" });

      // Wait for the page to load
      await this.page.waitForTimeout(3000);

      // Handle "Join now" or similar buttons
      await this.handleJoinFlow();

      this.emitStatus("joined");
      this.isRecording = true;

      // Start capturing audio
      await this.startAudioCapture();

      // Monitor for meeting end
      this.monitorMeetingEnd();

      // Periodically capture participants
      this.captureParticipantsPeriodically();
    } catch (error) {
      this.emitStatus("error", { error: (error as Error).message });
      throw error;
    }
  }

  private async handleJoinFlow(): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    try {
      // Enter name if there's a name input
      const nameInput = await this.page.$('input[aria-label*="name" i], input[placeholder*="name" i]');
      if (nameInput) {
        await nameInput.fill(this.options.botName);
        await this.page.waitForTimeout(500);
      }

      // Turn off camera and microphone before joining
      await this.turnOffCameraAndMic();

      // Look for join button variants
      const joinButtonSelectors = [
        'button:has-text("Join now")',
        'button:has-text("Ask to join")',
        'button:has-text("Join")',
        '[data-idom-class*="join"]',
        'button[jsname="Qx7uuf"]', // Google Meet specific
      ];

      for (const selector of joinButtonSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            await button.click();
            this.emitStatus("joining");
            break;
          }
        } catch {
          // Try next selector
        }
      }

      // Wait for meeting to load
      await this.page.waitForTimeout(5000);

      // Check if we're in a waiting room
      const waitingRoom = await this.page.$('text="Waiting for the host"');
      if (waitingRoom) {
        this.emitStatus("waiting", { message: "Waiting for host to admit" });
        // Wait up to 5 minutes for admission
        await this.page.waitForSelector('text="Waiting for the host"', {
          state: "hidden",
          timeout: 5 * 60 * 1000,
        });
      }

      // Verify we're in the meeting
      await this.page.waitForSelector('[data-participant-id], [data-self-name]', {
        timeout: 30000,
      });
    } catch (error) {
      console.error("Error during join flow:", error);
      throw new Error(`Failed to join meeting: ${(error as Error).message}`);
    }
  }

  private async turnOffCameraAndMic(): Promise<void> {
    if (!this.page) return;

    try {
      // Turn off camera
      const cameraButton = await this.page.$(
        'button[aria-label*="camera" i], button[data-is-muted="false"][aria-label*="video" i]'
      );
      if (cameraButton) {
        const isEnabled = await cameraButton.getAttribute("data-is-muted");
        if (isEnabled === "false") {
          await cameraButton.click();
        }
      }

      // Turn off microphone
      const micButton = await this.page.$(
        'button[aria-label*="microphone" i], button[data-is-muted="false"][aria-label*="mic" i]'
      );
      if (micButton) {
        const isEnabled = await micButton.getAttribute("data-is-muted");
        if (isEnabled === "false") {
          await micButton.click();
        }
      }
    } catch (error) {
      console.warn("Could not turn off camera/mic:", error);
    }
  }

  private async startAudioCapture(): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    // Create temp file for audio
    this.audioFilePath = path.join(os.tmpdir(), `meeting-${Date.now()}.webm`);
    this.audioFileStream = fs.createWriteStream(this.audioFilePath);

    // Expose function to receive audio chunks from browser
    await this.page.exposeFunction("__cascadeSendAudioChunk", (chunk: number[]) => {
      if (this.audioFileStream && chunk.length > 0) {
        this.audioFileStream.write(Buffer.from(chunk));
      }
    });

    // Expose function to signal recording stopped
    await this.page.exposeFunction("__cascadeRecordingStopped", () => {
      if (this.audioFileStream) {
        this.audioFileStream.end();
        this.audioFileStream = null;
      }
    });

    // Inject audio capture script with MediaRecorder
    await this.page.evaluate(() => {
      // Extend window interface for Cascade audio capture
      interface CascadeWindow extends Window {
        __cascadeAudioStream?: MediaStream;
        __cascadeAudioContext?: AudioContext;
        __cascadeMediaRecorder?: MediaRecorder;
        __cascadeConnectedElements?: WeakSet<HTMLMediaElement>;
        __cascadeSendAudioChunk?: (chunk: number[]) => void;
        __cascadeRecordingStopped?: () => void;
        __cascadeStopRecording?: () => void;
      }
      const cascadeWindow = window as CascadeWindow;

      // Track which elements we've already connected
      cascadeWindow.__cascadeConnectedElements = new WeakSet();

      // Create audio context and destination for mixing
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Get all audio/video elements and connect them
      const connectAudio = () => {
        const audioElements = document.querySelectorAll("audio, video");
        audioElements.forEach((element) => {
          const mediaElement = element as HTMLMediaElement;
          // Skip if already connected
          if (cascadeWindow.__cascadeConnectedElements?.has(mediaElement)) {
            return;
          }
          try {
            const source = audioContext.createMediaElementSource(mediaElement);
            source.connect(destination);
            source.connect(audioContext.destination); // Also play locally
            cascadeWindow.__cascadeConnectedElements?.add(mediaElement);
          } catch {
            // Element might already be connected or not ready
          }
        });
      };

      // Initial connection
      connectAudio();

      // Watch for new audio elements
      const observer = new MutationObserver(() => connectAudio());
      observer.observe(document.body, { childList: true, subtree: true });

      // Store references
      cascadeWindow.__cascadeAudioStream = destination.stream;
      cascadeWindow.__cascadeAudioContext = audioContext;

      // Create MediaRecorder to capture the mixed audio
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      // Send chunks to Node.js as they become available
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && cascadeWindow.__cascadeSendAudioChunk) {
          const arrayBuffer = await event.data.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          cascadeWindow.__cascadeSendAudioChunk(Array.from(uint8Array));
        }
      };

      mediaRecorder.onstop = () => {
        if (cascadeWindow.__cascadeRecordingStopped) {
          cascadeWindow.__cascadeRecordingStopped();
        }
      };

      // Start recording with 1-second chunks
      mediaRecorder.start(1000);
      cascadeWindow.__cascadeMediaRecorder = mediaRecorder;

      // Expose stop function
      cascadeWindow.__cascadeStopRecording = () => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
        audioContext.close();
        observer.disconnect();
      };
    });

    this.emitStatus("audio_capture_started");

    // Also enable captions as a backup for transcript
    await this.enableCaptions();
  }

  private async stopAudioCapture(): Promise<void> {
    if (!this.page) return;

    try {
      await this.page.evaluate(() => {
        interface CascadeWindow extends Window {
          __cascadeStopRecording?: () => void;
        }
        const cascadeWindow = window as CascadeWindow;
        if (cascadeWindow.__cascadeStopRecording) {
          cascadeWindow.__cascadeStopRecording();
        }
      });
    } catch {
      // Page might be closed
    }

    // Ensure file stream is closed
    if (this.audioFileStream) {
      this.audioFileStream.end();
      this.audioFileStream = null;
    }
  }

  private async enableCaptions(): Promise<void> {
    if (!this.page) return;

    try {
      // Try to enable captions for transcript
      const captionsButton = await this.page.$(
        'button[aria-label*="caption" i], button[aria-label*="subtitle" i]'
      );
      if (captionsButton) {
        await captionsButton.click();
        this.emitStatus("captions_enabled");
      }
    } catch (error) {
      console.warn("Could not enable captions:", error);
    }
  }

  private monitorMeetingEnd(): void {
    if (!this.page) return;

    let consecutiveAloneChecks = 0;
    const aloneThreshold = 3; // Need 3 consecutive checks (30 seconds) before leaving

    // Check periodically if meeting has ended
    const checkInterval = setInterval(async () => {
      if (!this.page || !this.isRecording) {
        clearInterval(checkInterval);
        return;
      }

      try {
        // Check for "You left the meeting" or similar indicators
        const leftMeeting = await this.page.$('text="You left the meeting"');
        const meetingEnded = await this.page.$('text="Meeting ended"');
        const returnHome = await this.page.$('text="Return to home screen"');

        if (leftMeeting || meetingEnded || returnHome) {
          clearInterval(checkInterval);
          await this.handleMeetingEnd();
          return;
        }

        // Check if we're alone (everyone else left)
        const participantCount = await this.getParticipantCount();
        if (participantCount <= 1) {
          consecutiveAloneChecks++;
          if (consecutiveAloneChecks >= aloneThreshold) {
            clearInterval(checkInterval);
            this.emitStatus("alone_timeout", {
              message: "Left meeting after being alone for 30 seconds",
            });
            await this.leave();
          }
        } else {
          // Reset counter if others join
          consecutiveAloneChecks = 0;
        }
      } catch {
        // Page might be closed
        clearInterval(checkInterval);
      }
    }, 10000); // Check every 10 seconds
  }

  private async getParticipantCount(): Promise<number> {
    if (!this.page) return 0;

    try {
      // Try to get participant count from the UI
      const countElement = await this.page.$('[data-participant-count], [aria-label*="participant" i]');
      if (countElement) {
        const text = await countElement.textContent();
        const match = text?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private captureParticipantsPeriodically(): void {
    if (!this.page) return;

    const captureInterval = setInterval(async () => {
      if (!this.page || !this.isRecording) {
        clearInterval(captureInterval);
        return;
      }

      try {
        const participants = await this.captureParticipants();
        if (participants.length > 0) {
          this.emitStatus("participants", { participants });
        }
      } catch {
        // Ignore errors
      }
    }, 60000); // Capture every minute
  }

  private async captureParticipants(): Promise<
    Array<{ displayName: string; email?: string; isHost: boolean }>
  > {
    if (!this.page) return [];

    try {
      // Get participant names from the meeting
      const participants = await this.page.evaluate(() => {
        const results: Array<{ displayName: string; isHost: boolean }> = [];

        // Try different selectors for participant names
        const participantElements = document.querySelectorAll(
          '[data-participant-id] [data-self-name], [data-participant-id] [data-participant-name]'
        );

        participantElements.forEach((el) => {
          const name = el.textContent?.trim();
          if (name) {
            results.push({
              displayName: name,
              isHost: el.closest("[data-is-host]") !== null,
            });
          }
        });

        return results;
      });

      return participants.map((p) => ({ ...p, email: undefined }));
    } catch {
      return [];
    }
  }

  private async handleMeetingEnd(): Promise<void> {
    this.isRecording = false;
    this.emitStatus("ended");

    // Stop audio capture and save file
    await this.stopAudioCapture();

    // Clean up browser
    await this.cleanup();

    // Resolve the wait promise
    if (this.endPromiseResolve && this.audioFilePath) {
      this.endPromiseResolve(this.audioFilePath);
    }
  }

  async leave(): Promise<void> {
    if (!this.page) return;

    try {
      // Click leave button
      const leaveButton = await this.page.$('button[aria-label*="Leave" i]');
      if (leaveButton) {
        await leaveButton.click();
        await this.page.waitForTimeout(2000);
      }
    } catch {
      // Ignore errors when leaving
    }

    await this.handleMeetingEnd();
  }

  async waitForEnd(): Promise<string> {
    return new Promise((resolve) => {
      this.endPromiseResolve = resolve;

      // Set a max duration (4 hours)
      const maxDurationMs = 4 * 60 * 60 * 1000;
      setTimeout(() => {
        if (this.isRecording) {
          this.emitStatus("max_duration_reached", {
            message: "Meeting exceeded 4-hour maximum duration limit",
            durationMs: maxDurationMs,
          });
          this.leave();
        }
      }, maxDurationMs);
    });
  }

  private async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    this.page = null;
  }

  private emitStatus(status: string, data?: Record<string, unknown>): void {
    if (this.options.onStatusChange) {
      this.options.onStatusChange(status, data);
    }
  }
}
