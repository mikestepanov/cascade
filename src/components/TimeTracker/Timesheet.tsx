import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, DollarSign, Trash2 } from "@/lib/icons";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { LoadingSpinner } from "../ui/LoadingSpinner";

// Type for time entry with computed hours field
type TimeEntryWithHours = Doc<"timeEntries"> & {
  hours: number;
};

export function Timesheet() {
  const timesheet = useQuery(api.timeEntries.getCurrentWeekTimesheet);
  const _updateEntry = useMutation(api.timeEntries.update);
  const deleteEntry = useMutation(api.timeEntries.remove);

  const [_editingEntry, _setEditingEntry] = useState<string | null>(null);

  if (!timesheet) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(2);
  };

  const getDaysOfWeek = () => {
    const days = [];
    const start = new Date(timesheet.startDate);
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const dayKey = day.toISOString().split("T")[0];
      days.push({
        date: day,
        dayKey,
        entries: timesheet.byDay[dayKey] || [],
      });
    }
    return days;
  };

  const handleDelete = async (entryId: Id<"timeEntries">) => {
    if (!confirm("Delete this time entry?")) return;

    try {
      await deleteEntry({ id: entryId });
      toast.success("Time entry deleted");
    } catch (_error) {
      toast.error("Failed to delete entry");
    }
  };

  const weekDays = getDaysOfWeek();
  const billableRevenue = timesheet.entries
    .filter((e: TimeEntryWithHours) => e.billable && e.hourlyRate)
    .reduce((sum: number, e: TimeEntryWithHours) => sum + e.hours * (e.hourlyRate ?? 0), 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
              My Timesheet
            </h2>
            <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              Week of {formatDate(timesheet.startDate)}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                Total Hours
              </div>
              <div className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
                {formatHours(timesheet.totalHours)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                Billable
              </div>
              <div className="text-2xl font-bold text-status-success">
                {formatHours(timesheet.billableHours)}
              </div>
            </div>
            {billableRevenue > 0 && (
              <div className="text-right">
                <div className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                  Revenue
                </div>
                <div className="text-2xl font-bold text-brand-600">
                  ${billableRevenue.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-full h-2">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min((timesheet.totalHours / 40) * 100, 100)}%` }}
          />
        </div>
        <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
          {formatHours(timesheet.totalHours)} / 40 hours (full-time week)
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          const dayHours = day.entries.reduce(
            (sum: number, e: TimeEntryWithHours) => sum + e.hours,
            0,
          );

          return (
            <div
              key={day.dayKey}
              className={`border rounded-lg p-3 ${
                isToday
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark"
              }`}
            >
              {/* Day header */}
              <div className="mb-2">
                <div className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                  {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                  {day.date.getDate()}
                </div>
                {dayHours > 0 && (
                  <div className="text-xs font-medium text-brand-600 mt-1">
                    {formatHours(dayHours)}h
                  </div>
                )}
              </div>

              {/* Time entries */}
              <div className="space-y-2">
                {day.entries.map((entry: TimeEntryWithHours) => (
                  <div
                    key={entry._id}
                    className="p-2 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded border border-ui-border-primary dark:border-ui-border-primary-dark"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                          {entry.projectKey}
                        </div>
                        <div className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark truncate">
                          {entry.issueKey}
                        </div>
                      </div>
                      {entry.billable && (
                        <DollarSign className="w-3 h-3 text-status-success flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        {formatHours(entry.hours)}h
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
                        className="p-1 text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-status-error rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {entry.description && (
                      <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1 line-clamp-1">
                        {entry.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {timesheet.totalHours === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-ui-text-tertiary dark:text-ui-text-tertiary-dark mx-auto mb-3" />
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
            No time entries this week. Start a timer to begin tracking!
          </p>
        </div>
      )}
    </div>
  );
}
