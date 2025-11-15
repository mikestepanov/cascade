import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { TimeEntriesList } from "./TimeEntriesList";
import { TimeLogModal } from "./TimeLogModal";

interface TimeTrackerProps {
  issueId: Id<"issues">;
  issueKey: string;
  issueTitle: string;
  estimatedHours?: number;
  loggedHours?: number;
}

export function TimeTracker({
  issueId,
  issueKey,
  issueTitle,
  estimatedHours = 0,
  loggedHours = 0,
}: TimeTrackerProps) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEntries, setShowEntries] = useState(false);

  const remainingHours = estimatedHours > 0 ? estimatedHours - loggedHours : null;
  const isOverEstimate = remainingHours !== null && remainingHours < 0;

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Time Tracking</h3>
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

        {/* Progress Bar */}
        {estimatedHours > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                {loggedHours}h / {estimatedHours}h estimated
              </span>
              {remainingHours !== null && (
                <span className={isOverEstimate ? "text-red-600 font-medium" : "text-gray-600"}>
                  {isOverEstimate ? "+" : ""}
                  {Math.abs(remainingHours)}h {isOverEstimate ? "over" : "remaining"}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverEstimate ? "bg-red-500" : "bg-blue-600"
                }`}
                style={{
                  width: `${Math.min((loggedHours / estimatedHours) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {estimatedHours === 0 && loggedHours > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{loggedHours}h</span> logged (no estimate set)
          </div>
        )}

        {estimatedHours === 0 && loggedHours === 0 && (
          <p className="text-sm text-gray-500">No time logged yet</p>
        )}
      </div>

      {/* Time Entries Toggle */}
      {loggedHours > 0 && (
        <button
          type="button"
          onClick={() => setShowEntries(!showEntries)}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <span>View Time Entries</span>
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
      {showEntries && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <TimeEntriesList issueId={issueId} />
        </div>
      )}

      {/* Log Time Modal */}
      {showLogModal && (
        <TimeLogModal
          issueId={issueId}
          issueName={`${issueKey}: ${issueTitle}`}
          onClose={() => setShowLogModal(false)}
        />
      )}
    </div>
  );
}
