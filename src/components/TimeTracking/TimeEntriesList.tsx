import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDate, formatTime } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
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
      <Flex justify="center" align="center" className="p-8">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="⏱️"
        title="No time entries"
        description="Start tracking time to see entries here."
      />
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
    <Flex direction="column" gap="xl">
      {/* Add Time Entry Button */}
      <Flex justify="end">
        <Button
          onClick={() => setShowManualEntryModal(true)}
          variant="primary"
          size="sm"
          leftIcon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          Add Time Entry
        </Button>
      </Flex>

      {Object.entries(groupedEntries).map(([date, dateEntries]) => {
        const totalDuration = dateEntries.reduce((sum, e) => sum + e.duration, 0);
        const totalCost = dateEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);

        return (
          <Flex key={date} direction="column" gap="sm">
            {/* Date header */}
            <Flex
              justify="between"
              align="center"
              className="py-2 border-b border-ui-border-primary dark:border-ui-border-primary-dark"
            >
              <h3 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                {date}
              </h3>
              <Flex
                align="center"
                gap="lg"
                className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark"
              >
                <span>{formatDurationDisplay(totalDuration)}</span>
                <span>{formatCurrency(totalCost, dateEntries[0]?.currency || "USD")}</span>
              </Flex>
            </Flex>

            {/* Entries for this date */}
            <Flex direction="column" gap="sm">
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

                    <Flex
                      align="center"
                      gap="md"
                      className="mt-1 text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark"
                    >
                      {entry.activity && <Badge variant="neutral">{entry.activity}</Badge>}

                      {entry.project && (
                        <Flex align="center" gap="xs" className="inline-flex">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                          {entry.project.name}
                        </Flex>
                      )}

                      {entry.issue && (
                        <Flex align="center" gap="xs" className="inline-flex">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {entry.issue.key}
                        </Flex>
                      )}

                      {entry.billable && <Badge variant="success">Billable</Badge>}

                      {entry.isLocked && (
                        <Flex
                          align="center"
                          gap="xs"
                          className="inline-flex text-status-warning dark:text-status-warning"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Locked
                        </Flex>
                      )}
                    </Flex>
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
                      <Button
                        onClick={() => handleDelete(entry._id)}
                        variant="ghost"
                        size="sm"
                        className="p-1 min-w-0 text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-status-error dark:hover:text-status-error"
                        aria-label="Delete entry"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </Flex>
          </Flex>
        );
      })}

      {/* Manual Time Entry Modal */}
      {showManualEntryModal && (
        <ManualTimeEntryModal
          onClose={() => setShowManualEntryModal(false)}
          projectId={projectId}
        />
      )}
    </Flex>
  );
}
