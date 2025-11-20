import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { formatCurrency, formatDate, formatHours } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ManualTimeEntryModal } from "./TimeTracking/ManualTimeEntryModal";

interface TimeTrackerProps {
  issueId: Id<"issues">;
  issueKey: string;
  issueTitle: string;
  estimatedHours?: number;
  loggedHours?: number;
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

  const remainingHours = estimatedHours > 0 ? estimatedHours - totalLoggedHours : null;
  const isOverEstimate = remainingHours !== null && remainingHours < 0;

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
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Time Tracking</h3>
          <div className="flex items-center gap-2">
            {/* Timer Button */}
            {isTimerRunningForThisIssue ? (
              <button
                type="button"
                onClick={handleStopTimer}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  />
                </svg>
                Stop Timer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTimer}
                disabled={!!runningTimer}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={runningTimer ? "Stop the current timer first" : "Start timer for this issue"}
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Start Timer
              </button>
            )}

            {/* Log Time Button */}
            <button
              type="button"
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
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
              Log Time
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {estimatedHours > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                {totalLoggedHours.toFixed(1)}h / {estimatedHours}h estimated
              </span>
              {remainingHours !== null && (
                <span className={isOverEstimate ? "text-red-600 font-medium" : "text-gray-600"}>
                  {isOverEstimate ? "+" : ""}
                  {Math.abs(remainingHours).toFixed(1)}h {isOverEstimate ? "over" : "remaining"}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverEstimate ? "bg-red-500" : "bg-blue-600"
                }`}
                style={{
                  width: `${Math.min((totalLoggedHours / estimatedHours) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {estimatedHours === 0 && totalLoggedHours > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{totalLoggedHours.toFixed(1)}h</span> logged (no
            estimate set)
          </div>
        )}

        {estimatedHours === 0 && totalLoggedHours === 0 && (
          <p className="text-sm text-gray-500">No time logged yet</p>
        )}
      </div>

      {/* Time Entries Toggle */}
      {totalLoggedHours > 0 && (
        <button
          type="button"
          onClick={() => setShowEntries(!showEntries)}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <span>View Time Entries ({timeEntries?.length || 0})</span>
          <svg
            aria-hidden="true"
            className={`w-4 h-4 transition-transform ${showEntries ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Time Entries List */}
      {showEntries && timeEntries && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
          {timeEntries.map((entry) => {
            const hours = formatHours(entry.duration);
            const entryDate = formatDate(entry.date);

            return (
              <div key={entry._id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{hours}h</div>
                    {entry.description && (
                      <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{entryDate}</span>
                      {entry.activity && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {entry.activity}
                        </span>
                      )}
                      {entry.billable && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          Billable
                        </span>
                      )}
                    </div>
                  </div>
                  {entry.totalCost && (
                    <div className="text-sm font-medium text-gray-700">
                      {formatCurrency(entry.totalCost)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Time Modal */}
      {showLogModal && (
        <ManualTimeEntryModal onClose={() => setShowLogModal(false)} issueId={issueId} />
      )}
    </div>
  );
}
