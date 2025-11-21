import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { formatCurrency, formatDate, formatHours } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { ManualTimeEntryModal } from "./TimeTracking/ManualTimeEntryModal";
import { Button } from "./ui/Button";

interface TimeTrackerProps {
  issueId: Id<"issues">;
  issueKey: string;
  issueTitle: string;
  estimatedHours?: number;
  loggedHours?: number;
}

/**
 * Time progress section with progress bar
 */
function TimeProgress({
  estimatedHours,
  totalLoggedHours,
}: {
  estimatedHours: number;
  totalLoggedHours: number;
}) {
  const remainingHours = estimatedHours > 0 ? estimatedHours - totalLoggedHours : null;
  const isOverEstimate = remainingHours !== null && remainingHours < 0;

  if (estimatedHours > 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
            {totalLoggedHours.toFixed(1)}h / {estimatedHours}h estimated
          </span>
          {remainingHours !== null && (
            <span
              className={
                isOverEstimate
                  ? "text-status-error dark:text-status-error-dark font-medium"
                  : "text-ui-text-secondary dark:text-ui-text-secondary-dark"
              }
            >
              {isOverEstimate ? "+" : ""}
              {Math.abs(remainingHours).toFixed(1)}h {isOverEstimate ? "over" : "remaining"}
            </span>
          )}
        </div>
        <div className="w-full bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isOverEstimate ? "bg-status-error" : "bg-brand-600"
            }`}
            style={{
              width: `${Math.min((totalLoggedHours / estimatedHours) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    );
  }

  if (totalLoggedHours > 0) {
    return (
      <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
        <span className="font-semibold">{totalLoggedHours.toFixed(1)}h</span> logged (no estimate
        set)
      </div>
    );
  }

  return (
    <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
      No time logged yet
    </p>
  );
}

/**
 * Time entries list component
 */
function TimeEntriesList({
  entries,
}: {
  entries: (Doc<"timeEntries"> & { totalCost?: number })[];
}) {
  return (
    <div className="p-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark space-y-2">
      {entries.map((entry) => {
        const hours = formatHours(entry.duration);
        const entryDate = formatDate(entry.date);

        return (
          <div
            key={entry._id}
            className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                  {hours}h
                </div>
                {entry.description && (
                  <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
                    {entry.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                    {entryDate}
                  </span>
                  {entry.activity && (
                    <span className="text-xs px-2 py-0.5 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded">
                      {entry.activity}
                    </span>
                  )}
                  {entry.billable && (
                    <span className="text-xs px-2 py-0.5 bg-status-success-bg dark:bg-status-success-dark text-status-success dark:text-status-success-dark rounded">
                      Billable
                    </span>
                  )}
                </div>
              </div>
              {entry.totalCost && (
                <div className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  {formatCurrency(entry.totalCost)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TimeTracker({
  issueId,
  _issueKey,
  _issueTitle,
  estimatedHours = 0,
  _loggedHours = 0,
}: TimeTrackerProps) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEntries, setShowEntries] = useState(false);

  // Fetch time entries for this issue
  const timeEntries = useQuery(api.timeTracking.listTimeEntries, {
    issueId,
    limit: 100,
  });

  // Check if there's a running timer
  const runningTimer = useQuery(api.timeTracking.getRunningTimer);
  const isTimerRunningForThisIssue = runningTimer && runningTimer.issueId === issueId;

  // Mutations
  const startTimer = useMutation(api.timeTracking.startTimer);
  const stopTimer = useMutation(api.timeTracking.stopTimer);

  // Calculate total hours from entries (convert seconds to hours)
  const totalLoggedHours = timeEntries
    ? timeEntries.reduce((sum, entry) => sum + entry.duration / 3600, 0)
    : 0;

  const handleStartTimer = async () => {
    try {
      await startTimer({ issueId });
      showSuccess("Timer started");
    } catch (error) {
      showError(error, "Failed to start timer");
    }
  };

  const handleStopTimer = async () => {
    if (!runningTimer) return;
    try {
      const result = await stopTimer({ entryId: runningTimer._id });
      const hours = formatHours(result.duration);
      showSuccess(`Timer stopped: ${hours}h logged`);
    } catch (error) {
      showError(error, "Failed to stop timer");
    }
  };

  return (
    <div className="border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
            Time Tracking
          </h3>
          <div className="flex items-center gap-2">
            {/* Timer Button */}
            {isTimerRunningForThisIssue ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleStopTimer}
                leftIcon={
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
              >
                Stop Timer
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartTimer}
                disabled={!!runningTimer}
                className="bg-status-success hover:bg-status-success-hover"
                title={runningTimer ? "Stop the current timer first" : "Start timer for this issue"}
                leftIcon={
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
              >
                Start Timer
              </Button>
            )}

            {/* Log Time Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogModal(true)}
              className="text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 hover:bg-brand-100 dark:hover:bg-brand-900"
              leftIcon={
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              }
            >
              Log Time
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <TimeProgress estimatedHours={estimatedHours} totalLoggedHours={totalLoggedHours} />
      </div>

      {/* Time Entries Toggle */}
      {totalLoggedHours > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEntries(!showEntries)}
          className="w-full justify-between min-h-0 rounded-none"
          rightIcon={
            <svg
              aria-hidden="true"
              className={`w-4 h-4 transition-transform ${showEntries ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          }
        >
          View Time Entries ({timeEntries?.length || 0})
        </Button>
      )}

      {/* Time Entries List */}
      {showEntries && timeEntries && <TimeEntriesList entries={timeEntries} />}

      {/* Log Time Modal */}
      {showLogModal && (
        <ManualTimeEntryModal onClose={() => setShowLogModal(false)} issueId={issueId} />
      )}
    </div>
  );
}
