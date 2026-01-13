import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Mic,
  MicOff,
  Play,
  XCircle,
} from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// Status badge configuration - extracted to reduce component complexity
interface StatusBadgeConfig {
  icon: ReactNode;
  label: string;
  className: string;
}

const STATUS_BADGE_CONFIG: Record<string, StatusBadgeConfig> = {
  scheduled: {
    icon: <Clock className="w-3 h-3 mr-1" />,
    label: "Scheduled",
    className: "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200",
  },
  joining: {
    icon: <Play className="w-3 h-3 mr-1 animate-pulse" />,
    label: "Joining...",
    className: "bg-status-warning-bg text-status-warning",
  },
  recording: {
    icon: <Mic className="w-3 h-3 mr-1 animate-pulse" />,
    label: "Recording",
    className: "bg-status-error-bg text-status-error",
  },
  processing: {
    icon: <LoadingSpinner size="xs" className="mr-1" />,
    label: "Processing...",
    className: "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200",
  },
  transcribing: {
    icon: <LoadingSpinner size="xs" className="mr-1" />,
    label: "Processing...",
    className: "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200",
  },
  summarizing: {
    icon: <LoadingSpinner size="xs" className="mr-1" />,
    label: "Processing...",
    className: "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200",
  },
  completed: {
    icon: <CheckCircle className="w-3 h-3 mr-1" />,
    label: "Completed",
    className: "bg-status-success-bg text-status-success",
  },
  failed: {
    icon: <XCircle className="w-3 h-3 mr-1" />,
    label: "Failed",
    className: "bg-status-error-bg text-status-error",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE_CONFIG[status];
  if (!config) return null;

  return (
    <Badge size="sm" className={config.className}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

// Platform detection helper
function detectPlatform(url: string): "google_meet" | "zoom" | "teams" | "other" {
  if (url.includes("meet.google.com")) return "google_meet";
  if (url.includes("zoom.us")) return "zoom";
  if (url.includes("teams.microsoft.com")) return "teams";
  return "other";
}

// Status message configuration for in-progress states
const IN_PROGRESS_MESSAGES: Record<string, string> = {
  recording: "Recording in progress...",
  transcribing: "Transcribing audio...",
  summarizing: "Generating summary...",
};

// Sub-components for each recording status
function NoRecordingState({
  onSchedule,
  isScheduling,
}: {
  onSchedule: () => void;
  isScheduling: boolean;
}) {
  return (
    <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4">
      <Typography variant="muted" className="mb-3">
        Schedule a bot to join this meeting and automatically generate transcripts and summaries.
      </Typography>
      <Button
        onClick={onSchedule}
        isLoading={isScheduling}
        leftIcon={<Mic className="w-4 h-4" />}
        size="sm"
      >
        {isScheduling ? "Scheduling..." : "Enable AI Notes"}
      </Button>
    </div>
  );
}

function ScheduledState({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4">
      <Flex justify="between" align="center">
        <div>
          <Typography
            variant="p"
            className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark"
          >
            Bot scheduled to join
          </Typography>
          <Typography variant="muted" size="xs">
            "Nixelo Notetaker" will join when the meeting starts
          </Typography>
        </div>
        <Button onClick={onCancel} variant="ghost" size="sm">
          <MicOff className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </Flex>
    </div>
  );
}

function FailedState({ errorMessage, onRetry }: { errorMessage?: string; onRetry: () => void }) {
  return (
    <div className="bg-status-error-bg dark:bg-status-error-bg-dark rounded-lg p-4">
      <Typography variant="p" className="font-medium text-status-error">
        Recording failed
      </Typography>
      <Typography variant="muted" size="xs" className="mt-1">
        {errorMessage || "An error occurred during recording"}
      </Typography>
      <Button onClick={onRetry} variant="secondary" size="sm" className="mt-3">
        Try Again
      </Button>
    </div>
  );
}

function InProgressState({ status }: { status: string }) {
  const message = IN_PROGRESS_MESSAGES[status] || "Processing...";
  return (
    <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4">
      <Flex gap="md" align="center">
        <LoadingSpinner size="sm" />
        <div>
          <Typography
            variant="p"
            className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark"
          >
            {message}
          </Typography>
          <Typography variant="muted" size="xs">
            This may take a few minutes
          </Typography>
        </div>
      </Flex>
    </div>
  );
}

// Recording status type from query
interface Recording {
  _id: Id<"meetingRecordings">;
  status: string;
  errorMessage?: string;
}

// Component to render the appropriate status content
function RecordingStatusContent({
  recording,
  isScheduling,
  onSchedule,
  onCancel,
}: {
  recording: Recording | null | undefined;
  isScheduling: boolean;
  onSchedule: () => void;
  onCancel: () => void;
}) {
  if (!recording) {
    return <NoRecordingState onSchedule={onSchedule} isScheduling={isScheduling} />;
  }

  switch (recording.status) {
    case "scheduled":
      return <ScheduledState onCancel={onCancel} />;
    case "completed":
      return <RecordingResults recordingId={recording._id} />;
    case "failed":
      return <FailedState errorMessage={recording.errorMessage} onRetry={onSchedule} />;
    default:
      return <InProgressState status={recording.status} />;
  }
}

interface MeetingRecordingSectionProps {
  calendarEventId: Id<"calendarEvents">;
  meetingUrl: string;
  meetingTitle: string;
  scheduledStartTime: number;
}

export function MeetingRecordingSection({
  calendarEventId,
  meetingUrl,
  meetingTitle,
  scheduledStartTime,
}: MeetingRecordingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const { dialogState, isConfirming, openConfirm, closeConfirm, handleConfirm } =
    useConfirmDialog();

  // Check if there's already a recording for this event (optimized query)
  const recording = useQuery(api.meetingBot.getRecordingByCalendarEvent, { calendarEventId });
  const scheduleRecording = useMutation(api.meetingBot.scheduleRecording);
  const cancelRecording = useMutation(api.meetingBot.cancelRecording);

  const handleScheduleRecording = async () => {
    setIsScheduling(true);
    try {
      await scheduleRecording({
        calendarEventId,
        meetingUrl,
        title: meetingTitle,
        meetingPlatform: detectPlatform(meetingUrl),
        scheduledStartTime,
        isPublic: true,
      });
      showSuccess("Recording scheduled! Bot will join at meeting time.");
    } catch (error) {
      showError(error, "Failed to schedule recording");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelRecording = () => {
    if (!recording) return;
    openConfirm({
      title: "Cancel Recording",
      message: "Cancel the scheduled recording?",
      confirmLabel: "Cancel Recording",
      variant: "warning",
    });
  };

  const executeCancelRecording = async () => {
    if (!recording) return;
    try {
      await cancelRecording({ recordingId: recording._id });
      showSuccess("Recording cancelled");
    } catch (error) {
      showError(error, "Failed to cancel recording");
    }
  };

  return (
    <div className="border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <Flex gap="sm" align="center">
          <Mic className="w-5 h-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
          <span className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
            AI Meeting Notes
          </span>
          {recording && <StatusBadge status={recording.status} />}
        </Flex>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-ui-text-tertiary" />
        ) : (
          <ChevronRight className="w-4 h-4 text-ui-text-tertiary" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <RecordingStatusContent
            recording={recording}
            isScheduling={isScheduling}
            onSchedule={handleScheduleRecording}
            onCancel={handleCancelRecording}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeConfirm}
        onConfirm={() => handleConfirm(executeCancelRecording)}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel={dialogState.confirmLabel}
        variant={dialogState.variant}
        isLoading={isConfirming}
      />
    </div>
  );
}

// Separate component for showing recording results
function RecordingResults({ recordingId }: { recordingId: Id<"meetingRecordings"> }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const recording = useQuery(api.meetingBot.getRecording, { recordingId });

  if (!recording) {
    return <LoadingSpinner size="sm" />;
  }

  const { summary, transcript } = recording;

  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      {summary && (
        <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4">
          <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Summary
          </h4>
          <Typography variant="muted">{summary.executiveSummary}</Typography>
        </div>
      )}

      {/* Key Points */}
      {summary && summary.keyPoints.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Key Points
          </h4>
          <ul className="space-y-1">
            {summary.keyPoints.map((point: string) => (
              <li
                key={point}
                className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark flex items-start gap-2"
              >
                <span className="text-brand-600">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {summary && summary.actionItems.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Action Items
          </h4>
          <ul className="space-y-2">
            {summary.actionItems.map((item: { description: string }, index: number) => (
              <li
                key={`action-${index}-${item.description.slice(0, 20)}`}
                className="text-sm bg-status-warning-bg dark:bg-status-warning-bg-dark rounded p-2"
              >
                <Flex justify="between" align="start">
                  <span className="text-ui-text-primary dark:text-ui-text-primary-dark">
                    {item.description}
                  </span>
                  {item.assignee && (
                    <Badge size="sm" className="ml-2 shrink-0">
                      {item.assignee}
                    </Badge>
                  )}
                </Flex>
                {item.dueDate && (
                  <span className="text-xs text-ui-text-tertiary mt-1 block">
                    Due: {item.dueDate}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Decisions */}
      {summary && summary.decisions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Decisions Made
          </h4>
          <ul className="space-y-1">
            {summary.decisions.map((decision: string) => (
              <li
                key={decision}
                className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark flex items-start gap-2"
              >
                <CheckCircle className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                {decision}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transcript Toggle */}
      {transcript && (
        <div>
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <FileText className="w-4 h-4" />
            {showTranscript ? "Hide Transcript" : "Show Full Transcript"}
            {showTranscript ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {showTranscript && (
            <div className="mt-2 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark whitespace-pre-wrap font-sans">
                {transcript.fullText}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {transcript && (
        <Flex gap="md" className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
          <span>{transcript.wordCount.toLocaleString()} words</span>
          <span>•</span>
          <span>{recording.duration ? Math.round(recording.duration / 60) : "?"} min</span>
          {transcript.speakerCount && (
            <>
              <span>•</span>
              <span>{transcript.speakerCount} speakers</span>
            </>
          )}
        </Flex>
      )}
    </div>
  );
}
