import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { formatDate } from "@/lib/dates";
import { getTypeIcon } from "@/lib/issue-utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { IssueDetailModal } from "./IssueDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/ShadcnSelect";
import { Skeleton } from "./ui/Skeleton";
import { ToggleGroup, ToggleGroupItem } from "./ui/ToggleGroup";
import { Typography } from "./ui/Typography";

interface RoadmapViewProps {
  workspaceId: Id<"workspaces">;
  sprintId?: Id<"sprints">;
  canEdit?: boolean;
}

export function RoadmapView({ workspaceId, sprintId, canEdit = true }: RoadmapViewProps) {
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [viewMode, setViewMode] = useState<"months" | "weeks">("months");
  const [filterEpic, setFilterEpic] = useState<Id<"issues"> | "all">("all");

  const issues = useQuery(api.issues.listByProject, { workspaceId, sprintId });
  const project = useQuery(api.workspaces.get, { id: workspaceId });

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

  if (!(project && issues)) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark p-4">
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
    if (!(startDate && endDate)) return 5; // Default width
    const totalDays = Math.floor(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    const timelineTotal = Math.floor((endDate - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max((totalDays / timelineTotal) * 100, 2); // Minimum 2%
  };

  const getRoadmapPriorityColor = (priority: string) => {
    // Map priority to full background colors for roadmap bars
    const colorMap: Record<string, string> = {
      highest: "bg-status-error",
      high: "bg-status-warning",
      medium: "bg-accent-500",
      low: "bg-brand-500",
      lowest: "bg-ui-text-secondary dark:bg-ui-text-secondary-dark",
    };
    return colorMap[priority] || "bg-ui-text-secondary dark:bg-ui-text-secondary-dark";
  };

  const _getTypeIcon = (type: string) => {
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
          <Typography variant="h2" className="text-2xl font-bold">
            Roadmap
          </Typography>
          <Typography variant="muted" className="mt-1">
            Visualize issue timeline and dependencies
          </Typography>
        </div>

        <div className="flex gap-3">
          {/* Epic Filter */}
          <Select
            value={filterEpic === "all" ? "all" : filterEpic}
            onValueChange={(value) =>
              setFilterEpic(value === "all" ? "all" : (value as Id<"issues">))
            }
          >
            <SelectTrigger className="px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark">
              <SelectValue placeholder="All Epics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Epics</SelectItem>
              {epics.map((epic) => (
                <SelectItem key={epic._id} value={epic._id}>
                  {epic.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "months" | "weeks")}
            size="sm"
          >
            <ToggleGroupItem value="months">Months</ToggleGroupItem>
            <ToggleGroupItem value="weeks">Weeks</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark overflow-hidden">
        {/* Timeline Header */}
        <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark p-4">
          <div className="flex">
            <div className="w-64 flex-shrink-0 font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
              Issue
            </div>
            <div className="flex-1 grid grid-cols-6">
              {timelineMonths.map((month) => (
                <div
                  key={month.getTime()}
                  className="text-center text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark border-l border-ui-border-primary dark:border-ui-border-primary-dark px-2"
                >
                  {month.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Body */}
        <div className="divide-y divide-ui-border-primary dark:divide-ui-border-primary-dark">
          {filteredIssues.length === 0 ? (
            <div className="p-12 text-center text-ui-text-secondary dark:text-ui-text-secondary-dark">
              <p>No issues with due dates to display</p>
              <p className="text-sm mt-1">Add due dates to issues to see them on the roadmap</p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className="flex items-center p-3 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors"
              >
                {/* Issue Info */}
                <div className="w-64 flex-shrink-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{getTypeIcon(issue.type)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedIssue(issue._id)}
                      className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark hover:text-brand-600 dark:hover:text-brand-400 truncate text-left"
                    >
                      {issue.key}
                    </button>
                  </div>
                  <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark truncate">
                    {issue.title}
                  </p>
                </div>

                {/* Timeline Bar */}
                <div className="flex-1 relative h-8">
                  {issue.dueDate && (
                    <button
                      type="button"
                      className={`absolute h-6 rounded-full ${getRoadmapPriorityColor(issue.priority)} opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center px-2`}
                      style={{
                        left: `${getPositionOnTimeline(issue.dueDate)}%`,
                        width: "5%", // Default width for single date
                      }}
                      onClick={() => setSelectedIssue(issue._id)}
                      title={`${issue.title} - Due: ${formatDate(issue.dueDate)}`}
                      aria-label={`View issue ${issue.key}`}
                    >
                      <span className="text-xs text-white font-medium truncate">
                        {issue.assignee?.name.split(" ")[0]}
                      </span>
                    </button>
                  )}

                  {/* Today Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-status-error z-10"
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
