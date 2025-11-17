import { useMutation, useQuery } from "convex/react";
import { Calendar, Clock, DollarSign, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

export function Timesheet() {
  const timesheet = useQuery(api.timeEntries.getCurrentWeekTimesheet);
  const updateEntry = useMutation(api.timeEntries.update);
  const deleteEntry = useMutation(api.timeEntries.remove);

  const [editingEntry, setEditingEntry] = useState<string | null>(null);

  if (!timesheet) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
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

  const handleDelete = async (entryId: string) => {
    if (!confirm("Delete this time entry?")) return;

    try {
      await deleteEntry({ id: entryId as any });
      toast.success("Time entry deleted");
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const weekDays = getDaysOfWeek();
  const billableRevenue = timesheet.entries
    .filter((e: any) => e.billable && e.hourlyRate)
    .reduce((sum: number, e: any) => sum + e.hours * e.hourlyRate, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Timesheet</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Week of {formatDate(timesheet.startDate)}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Hours</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatHours(timesheet.totalHours)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Billable</div>
              <div className="text-2xl font-bold text-green-600">
                {formatHours(timesheet.billableHours)}
              </div>
            </div>
            {billableRevenue > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Revenue</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${billableRevenue.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min((timesheet.totalHours / 40) * 100, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatHours(timesheet.totalHours)} / 40 hours (full-time week)
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          const dayHours = day.entries.reduce((sum: number, e: any) => sum + e.hours, 0);

          return (
            <div
              key={day.dayKey}
              className={`border rounded-lg p-3 ${
                isToday
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              {/* Day header */}
              <div className="mb-2">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{day.date.getDate()}</div>
                {dayHours > 0 && (
                  <div className="text-xs font-medium text-blue-600 mt-1">
                    {formatHours(dayHours)}h
                  </div>
                )}
              </div>

              {/* Time entries */}
              <div className="space-y-2">
                {day.entries.map((entry: any) => (
                  <div
                    key={entry._id}
                    className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-medium text-gray-900 dark:text-white truncate">
                          {entry.projectKey}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {entry.issueKey}
                        </div>
                      </div>
                      {entry.billable && (
                        <DollarSign className="w-3 h-3 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatHours(entry.hours)}h
                      </span>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {entry.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
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
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No time entries this week. Start a timer to begin tracking!
          </p>
        </div>
      )}
    </div>
  );
}
