import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { getPriorityColor, getTypeIcon } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { IssueDetailModal } from "./IssueDetailModal";
import { Typography } from "./ui/Typography";

interface CalendarViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  canEdit?: boolean;
}

export function CalendarView({ projectId, sprintId, canEdit = true }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate the visible date range (including padding days)
  const { startTimestamp, endTimestamp, firstDayOfMonth, daysInMonth } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Start from the beginning of the first week row
    // (subtract days to get to previous Sunday if needed, though here we just render empty cells,
    // but for data fetching we might want to include them if we were rendering them)
    // The current UI renders empty cells for previous month days:
    // for (let i = 0; i < firstDayOfMonth; i++) { ... }
    // So we strictly need data starting from the 1st of the month.
    // However, to be safe and cover full days, we use start of 1st day to end of last day.

    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return {
      startTimestamp: start.getTime(),
      endTimestamp: end.getTime(),
      firstDayOfMonth: firstDayOfWeek,
      daysInMonth: daysCount,
    };
  }, [year, month]);

  const issues = useQuery(api.issues.listIssuesByDateRange, {
    projectId,
    sprintId,
    from: startTimestamp,
    to: endTimestamp,
  });

  // Group issues by date
  const issuesByDate = useMemo(() => {
    const byDate: Record<string, typeof issues> = {};
    issues?.forEach((issue: Doc<"issues">) => {
      if (issue.dueDate) {
        const dateKey = new Date(issue.dueDate).toDateString();
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(issue);
      }
    });
    return byDate;
  }, [issues]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getIssuesForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = date.toDateString();
    return issuesByDate[dateKey] || [];
  };

  // Generate calendar grid
  const calendarDays = [];
  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="min-h-32 md:min-h-24 bg-ui-bg-secondary" />,
    );
  }
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayIssues = getIssuesForDay(day);
    const isTodayDate = isToday(day);

    calendarDays.push(
      <div
        key={day}
        className={cn(
          "min-h-32 md:min-h-24 border border-ui-border-primary dark:border-ui-border-primary-dark p-2",
          isTodayDate
            ? "bg-brand-50 dark:bg-brand-900/20"
            : "bg-ui-bg-primary dark:bg-ui-bg-primary-dark",
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "text-sm font-medium",
              isTodayDate
                ? "bg-brand-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                : "text-ui-text-primary dark:text-ui-text-primary-dark",
            )}
          >
            {day}
          </span>
          {dayIssues.length > 0 && (
            <span className="text-xs bg-ui-bg-tertiary text-ui-text-primary px-1.5 py-0.5 rounded">
              {dayIssues.length}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {(dayIssues ?? []).slice(0, 3).map((issue: Doc<"issues">) => (
            <button
              type="button"
              key={issue._id}
              onClick={() => setSelectedIssue(issue._id)}
              className="w-full text-left p-1.5 rounded hover:bg-ui-bg-secondary transition-colors"
              title={issue.title}
            >
              <div className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", getPriorityColor(issue.priority))} />
                <span className="text-xs truncate flex-1">
                  {getTypeIcon(issue.type)} {issue.title}
                </span>
              </div>
            </button>
          ))}
          {dayIssues.length > 3 && (
            <Typography variant="muted" className="text-xs pl-1.5">
              +{dayIssues.length - 3} more
            </Typography>
          )}
        </div>
      </div>,
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Typography variant="h2" className="text-xl sm:text-2xl font-bold">
          Calendar View
        </Typography>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={previousMonth}
            className="p-2 hover:bg-ui-bg-secondary rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label="Previous month"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <Typography
            variant="h3"
            className="text-lg sm:text-xl font-semibold w-full sm:min-w-48 text-center"
          >
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Typography>

          <button
            type="button"
            onClick={nextMonth}
            className="p-2 hover:bg-ui-bg-secondary rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label="Next month"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="px-3 sm:px-4 py-2 bg-ui-bg-tertiary hover:bg-ui-bg-secondary rounded-lg text-sm font-medium transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="bg-ui-bg-primary rounded-lg border border-ui-border-primary overflow-hidden min-w-[640px]">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-ui-bg-secondary border-b border-ui-border-primary">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-semibold text-ui-text-primary">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">{calendarDays}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-error" />
          <span className="text-ui-text-secondary">Highest</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-warning" />
          <span className="text-ui-text-secondary">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-500" />
          <span className="text-ui-text-secondary">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand-500" />
          <span className="text-ui-text-secondary">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-ui-text-secondary" />
          <span className="text-ui-text-secondary">Lowest</span>
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issueId={selectedIssue}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIssue(null);
            }
          }}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
