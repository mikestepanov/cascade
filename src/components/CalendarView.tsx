import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { IssueDetailModal } from "./IssueDetailModal";

interface CalendarViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
}

export function CalendarView({ projectId, sprintId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);

  const issues = useQuery(api.issues.listByProject, { projectId, sprintId });

  // Get calendar data
  const { daysInMonth, firstDayOfMonth, issuesByDate } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    // Group issues by date
    const byDate: Record<string, typeof issues> = {};
    issues?.forEach((issue) => {
      if (issue.dueDate) {
        const dateKey = new Date(issue.dueDate).toDateString();
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(issue);
      }
    });

    return {
      daysInMonth: daysCount,
      firstDayOfMonth: firstDayOfWeek,
      issuesByDate: byDate,
    };
  }, [currentDate, issues]);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "highest":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      case "lowest":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "story":
        return "📖";
      case "epic":
        return "⚡";
      default:
        return "✓";
    }
  };

  // Generate calendar grid
  const calendarDays = [];
  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="min-h-24 bg-gray-50 dark:bg-gray-900" />);
  }
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayIssues = getIssuesForDay(day);
    const isTodayDate = isToday(day);

    calendarDays.push(
      <div
        key={day}
        className={`min-h-24 border border-gray-200 dark:border-gray-700 p-2 ${
          isTodayDate ? "bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-gray-800"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-sm font-medium ${
              isTodayDate
                ? "bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {day}
          </span>
          {dayIssues.length > 0 && (
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
              {dayIssues.length}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {dayIssues.slice(0, 3).map((issue) => (
            <button
              key={issue._id}
              onClick={() => setSelectedIssue(issue._id)}
              className="w-full text-left p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={issue.title}
            >
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(issue.priority)}`} />
                <span className="text-xs truncate flex-1">
                  {getTypeIcon(issue.type)} {issue.title}
                </span>
              </div>
            </button>
          ))}
          {dayIssues.length > 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-1.5">
              +{dayIssues.length - 3} more
            </p>
          )}
        </div>
      </div>,
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar View</h2>

        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <h3 className="text-xl font-semibold min-w-48 text-center text-gray-900 dark:text-gray-100">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">{calendarDays}</div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Highest</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-600 dark:text-gray-400">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600 dark:text-gray-400">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">Lowest</span>
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal issueId={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}
    </div>
  );
}
