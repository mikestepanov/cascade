import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { handleKeyboardClick } from "@/lib/accessibility";
import { formatDate } from "@/lib/dates";
import { getTypeIcon } from "@/lib/issue-utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { IssueDetailModal } from "./IssueDetailModal";
import { Skeleton } from "./ui/Skeleton";

interface RoadmapViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
}

export function RoadmapView({ projectId, sprintId }: RoadmapViewProps) {
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [viewMode, setViewMode] = useState<"months" | "weeks">("months");
  const [filterEpic, setFilterEpic] = useState<Id<"issues"> | "all">("all");

  const issues = useQuery(api.issues.listByProject, { projectId, sprintId });
  const project = useQuery(api.projects.get, { id: projectId });

  // Filter epics and regular issues
  const epics = issues?.filter((issue) => issue.type === "epic") || [];
  const filteredIssues = useMemo(() => {
    if (!issues) return [];

    let filtered = issues.filter((issue) => issue.type !== "epic");

    if (filterEpic !== "all") {
      filtered = filtered.filter((issue) => issue.epicId === filterEpic);
    }

    // Only show issues with due dates
    filtered = filtered.filter((issue) => issue.dueDate);

    return filtered;
  }, [issues, filterEpic]);

  if (!project || !issues) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Calculate date range
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 6, 0); // 6 months ahead

  // Generate timeline columns
  const timelineMonths: Date[] = [];
  for (let i = 0; i < 6; i++) {
    timelineMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
  }

  const getPositionOnTimeline = (date: number) => {
    const issueDate = new Date(date);
    const totalDays = Math.floor(
      (endDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysSinceStart = Math.floor(
      (issueDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (daysSinceStart / totalDays) * 100;
  };

  const _getDuration = (startDate?: number, endDate?: number) => {
    if (!startDate || !endDate) return 5; // Default width
    const totalDays = Math.floor(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    const timelineTotal = Math.floor((endDate - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max((totalDays / timelineTotal) * 100, 2); // Minimum 2%
  };

  const getRoadmapPriorityColor = (priority: string) => {
    // Map priority to full background colors for roadmap bars
    const colorMap: Record<string, string> = {
      highest: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-blue-500",
      lowest: "bg-gray-500",
    };
    return colorMap[priority] || "bg-gray-500";
  };

  const _getTypeIcon = (type: string) => {
    // Removed - using getTypeIcon from utilities
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

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Roadmap</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visualize issue timeline and dependencies
          </p>
        </div>

        <div className="flex gap-3">
          {/* Epic Filter */}
          <select
            value={filterEpic}
            onChange={(e) =>
              setFilterEpic(e.target.value === "all" ? "all" : (e.target.value as Id<"issues">))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Epics</option>
            {epics.map((epic) => (
              <option key={epic._id} value={epic._id}>
                {epic.title}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode("months")}
              className={`px-3 py-1 rounded ${
                viewMode === "months"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Months
            </button>
            <button
              type="button"
              onClick={() => setViewMode("weeks")}
              className={`px-3 py-1 rounded ${
                viewMode === "weeks"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Weeks
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Timeline Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <div className="flex">
            <div className="w-64 flex-shrink-0 font-medium text-gray-700 dark:text-gray-300">
              Issue
            </div>
            <div className="flex-1 grid grid-cols-6">
              {timelineMonths.map((month) => (
                <div
                  key={month.getTime()}
                  className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 px-2"
                >
                  {month.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredIssues.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <p>No issues with due dates to display</p>
              <p className="text-sm mt-1">Add due dates to issues to see them on the roadmap</p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                {/* Issue Info */}
                <div className="w-64 flex-shrink-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{getTypeIcon(issue.type)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedIssue(issue._id)}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary truncate text-left"
                    >
                      {issue.key}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{issue.title}</p>
                </div>

                {/* Timeline Bar */}
                <div className="flex-1 relative h-8">
                  {issue.dueDate && (
                    <div
                      role="button"
                      tabIndex={0}
                      className={`absolute h-6 rounded-full ${getRoadmapPriorityColor(issue.priority)} opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center px-2`}
                      style={{
                        left: `${getPositionOnTimeline(issue.dueDate)}%`,
                        width: "5%", // Default width for single date
                      }}
                      onClick={() => setSelectedIssue(issue._id)}
                      onKeyDown={handleKeyboardClick(() => setSelectedIssue(issue._id))}
                      title={`${issue.title} - Due: ${formatDate(issue.dueDate)}`}
                      aria-label={`View issue ${issue.key}`}
                    >
                      <span className="text-xs text-white font-medium truncate">
                        {issue.assignee?.name.split(" ")[0]}
                      </span>
                    </div>
                  )}

                  {/* Today Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${getPositionOnTimeline(Date.now())}%` }}
                    title="Today"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal issueId={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}
    </div>
  );
}
