import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDate, formatTime } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ManualTimeEntryModal } from "./ManualTimeEntryModal";

interface TimeEntriesListProps {
  projectId?: Id<"projects">;
  userId?: Id<"users">;
  startDate?: number;
  endDate?: number;
}

export function TimeEntriesList({ projectId, userId, startDate, endDate }: TimeEntriesListProps) {
  const entries = useQuery(api.timeTracking.listTimeEntries, {
    projectId,
    userId,
    startDate,
    endDate,
    limit: 100,
  });

  const deleteEntry = useMutation(api.timeTracking.deleteTimeEntry);

  const [_editingEntry, _setEditingEntry] = useState<string | null>(null);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);

  // Format duration for display (hours and minutes)
  const formatDurationDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDelete = async (entryId: Id<"timeEntries">) => {
    if (!confirm("Are you sure you want to delete this time entry?")) {
      return;
    }

    try {
      await deleteEntry({ entryId });
      showSuccess("Time entry deleted");
    } catch (error) {
      showError(error, "Failed to delete time entry");
    }
  };

  if (!entries) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center p-8">
        <svg
          className="mx-auto h-12 w-12 text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
          No time entries
        </h3>
        <p className="mt-1 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
          Start tracking time to see entries here.
        </p>
      </div>
    );
  }

  // Group entries by date
  const groupedEntries: Record<string, typeof entries> = {};
  entries.forEach((entry) => {
    const dateKey = formatDate(entry.date);
    if (!groupedEntries[dateKey]) {
      groupedEntries[dateKey] = [];
    }
    groupedEntries[dateKey].push(entry);
  });

  return (
    <div className="space-y-6">
      {/* Add Time Entry Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowManualEntryModal(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Time Entry
        </button>
      </div>

      {Object.entries(groupedEntries).map(([date, dateEntries]) => {
        const totalDuration = dateEntries.reduce((sum, e) => sum + e.duration, 0);
        const totalCost = dateEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);

        return (
          <div key={date} className="space-y-2">
            {/* Date header */}
            <div className="flex items-center justify-between py-2 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
              <h3 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">{date}</h3>
              <div className="flex items-center gap-4 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                <span>{formatDurationDisplay(totalDuration)}</span>
                <span>{formatCurrency(totalCost, dateEntries[0]?.currency || "USD")}</span>
              </div>
            </div>

            {/* Entries for this date */}
            <div className="space-y-2">
              {dateEntries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-start gap-4 p-3 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg hover:border-ui-border-secondary dark:hover:border-ui-border-secondary-dark transition-colors"
                >
                  {/* Time range */}
                  <div className="flex-shrink-0 text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark w-24">
                    {formatTime(entry.startTime)}
                    {entry.endTime && (
                      <>
                        <br />
                        {formatTime(entry.endTime)}
                      </>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {entry.description && (
                      <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        {entry.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1 text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                      {entry.activity && (
                        <span className="px-2 py-0.5 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded">
                          {entry.activity}
                        </span>
                      )}

                      {entry.project && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                          {entry.project.name}
                        </span>
                      )}

                      {entry.issue && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {entry.issue.key}
                        </span>
                      )}

                      {entry.billable && (
                        <span className="px-2 py-0.5 bg-status-success/10 dark:bg-status-success/20 text-status-success dark:text-status-success rounded">
                          Billable
                        </span>
                      )}

                      {entry.isLocked && (
                        <span className="flex items-center gap-1 text-status-warning dark:text-status-warning">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Duration and cost */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                      {formatDurationDisplay(entry.duration)}
                    </div>
                    {entry.totalCost !== undefined && entry.totalCost > 0 && (
                      <div className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        {formatCurrency(entry.totalCost, entry.currency)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!(entry.isLocked || entry.billed) && (
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
                        className="p-1 text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-status-error dark:hover:text-status-error transition-colors"
                        title="Delete entry"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Manual Time Entry Modal */}
      {showManualEntryModal && (
        <ManualTimeEntryModal
          onClose={() => setShowManualEntryModal(false)}
          projectId={projectId}
        />
      )}
    </div>
  );
}
