import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount || 0);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(timestamp);
  };

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(timestamp);
  };

  const handleDelete = async (entryId: Id<"timeEntries">) => {
    if (!confirm("Are you sure you want to delete this time entry?")) {
      return;
    }

    try {
      await deleteEntry({ entryId });
      toast.success("Time entry deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete time entry");
    }
  };

  if (!entries) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center p-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No time entries
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
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
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{date}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{formatDuration(totalDuration)}</span>
                <span>{formatCurrency(totalCost, dateEntries[0]?.currency || "USD")}</span>
              </div>
            </div>

            {/* Entries for this date */}
            <div className="space-y-2">
              {dateEntries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-start gap-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  {/* Time range */}
                  <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 w-24">
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
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {entry.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {entry.activity && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
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
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          Billable
                        </span>
                      )}

                      {entry.isLocked && (
                        <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
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
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDuration(entry.duration)}
                    </div>
                    {entry.totalCost !== undefined && entry.totalCost > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatCurrency(entry.totalCost, entry.currency)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!entry.isLocked && !entry.billed && (
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
