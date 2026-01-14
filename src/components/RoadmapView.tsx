import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { List, type ListImperativeAPI } from "react-window";

import { useListNavigation } from "@/hooks/useListNavigation";
import { formatDate } from "@/lib/dates";
import { getPriorityColor, getTypeIcon } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { IssueDetailModal } from "./IssueDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { Skeleton } from "./ui/Skeleton";
import { ToggleGroup, ToggleGroupItem } from "./ui/ToggleGroup";
import { Typography } from "./ui/Typography";

// Pure function - no need to be inside component

interface RoadmapViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  canEdit?: boolean;
}

export function RoadmapView({ projectId, sprintId, canEdit = true }: RoadmapViewProps) {
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [viewMode, setViewMode] = useState<"months" | "weeks">("months");
  const [filterEpic, setFilterEpic] = useState<Id<"issues"> | "all">("all");

  const issues = useQuery(api.issues.listRoadmapIssues, { projectId, sprintId });
  const project = useQuery(api.projects.getProject, { id: projectId });

  type RoadmapIssue = FunctionReturnType<typeof api.issues.listRoadmapIssues>[number];

  // Filter epics and regular issues
  const epics = issues?.filter((issue: RoadmapIssue) => issue.type === "epic") || [];
  const filteredIssues = useMemo(() => {
    if (!issues) return [];

    let filtered = issues.filter((issue: RoadmapIssue) => issue.type !== "epic");

    if (filterEpic !== "all") {
      filtered = filtered.filter((issue: RoadmapIssue) => issue.epicId === filterEpic);
    }

    // Only show issues with due dates
    filtered = filtered.filter((issue: RoadmapIssue) => issue.dueDate);

    return filtered;
  }, [issues, filterEpic]);

  // Memoize date range calculations - only recalculate when component mounts
  const { startOfMonth, endDate, timelineMonths } = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 6, 0); // 6 months ahead

    // Generate timeline columns
    const months: Date[] = [];
    for (let i = 0; i < 6; i++) {
      months.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
    }

    return { startOfMonth: start, endDate: end, timelineMonths: months };
  }, []);

  const getPositionOnTimeline = useCallback(
    (date: number) => {
      const issueDate = new Date(date);
      const totalDays = Math.floor(
        (endDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysSinceStart = Math.floor(
        (issueDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
      );
      return (daysSinceStart / totalDays) * 100;
    },
    [startOfMonth, endDate],
  );

  // Keyboard navigation
  const listRef = useRef<ListImperativeAPI>(null);
  const { selectedIndex } = useListNavigation({
    items: filteredIssues,
    onSelect: (issue: RoadmapIssue) => setSelectedIssue(issue._id),
  });

  // Sync keyboard selection with scroll
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      listRef.current.scrollToRow({ index: selectedIndex });
    }
  }, [selectedIndex]);

  // Row renderer for virtualization
  type RowData = {
    issues: typeof filteredIssues;
    selectedIndex: number;
  };

  const Row = useCallback(
    ({
      issues,
      selectedIndex,
      index,
      style,
    }: RowData & {
      index: number;
      style: React.CSSProperties;
    }) => {
      const issue = issues[index];
      const isSelected = index === selectedIndex;

      return (
        <div
          style={style}
          className={cn(
            "flex items-center p-3 transition-colors border-b border-ui-border-primary",
            isSelected
              ? "bg-brand-50/50 dark:bg-brand-900/20 ring-1 ring-inset ring-brand-500/50 z-10"
              : "hover:bg-ui-bg-secondary",
          )}
        >
          {/* Issue Info */}
          <div className="w-64 shrink-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{getTypeIcon(issue.type)}</span>
              <button
                type="button"
                onClick={() => setSelectedIssue(issue._id)}
                className={cn(
                  "text-sm font-medium truncate text-left",
                  isSelected
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-ui-text-primary hover:text-brand-600 dark:hover:text-brand-400",
                )}
              >
                {issue.key}
              </button>
            </div>
            <Typography className="text-xs text-ui-text-secondary truncate">
              {issue.title}
            </Typography>
          </div>

          {/* Timeline Bar */}
          <div className="flex-1 relative h-8">
            {issue.dueDate && (
              <button
                type="button"
                className={cn(
                  "absolute h-6 rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center px-2",
                  getPriorityColor(issue.priority, "bg"),
                )}
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
      );
    },
    [getPositionOnTimeline],
  );

  // Loading State
  if (!(project && issues)) {
    return (
      <div className="flex-1 overflow-hidden p-6 flex flex-col h-full">
        {/* Skeleton Header */}
        <div className="mb-6 flex items-center justify-between shrink-0">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>

        {/* Skeleton Timeline */}
        <div className="flex-1 bg-ui-bg-primary rounded-lg border border-ui-border-primary overflow-hidden flex flex-col">
          {/* Skeleton Dates Header */}
          <div className="border-b border-ui-border-primary bg-ui-bg-secondary p-4 shrink-0">
            <div className="flex">
              <div className="w-64 shrink-0">
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex-1 grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((id) => (
                  <Skeleton key={id} className="h-5 w-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Skeleton Rows */}
          <div className="flex-1 overflow-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center p-3 border-b border-ui-border-primary">
                <div className="w-64 shrink-0 pr-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex-1 relative h-8">
                  <div
                    className="absolute h-6"
                    style={{
                      left: `${(i * 13) % 70}%`, // Deterministic position
                      width: `${10 + ((i * 3) % 10)}%`,
                    }}
                  >
                    <Skeleton className="h-full w-full rounded-full opacity-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden p-6 flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between shrink-0">
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
            <SelectTrigger className="px-3 py-2 border border-ui-border-primary rounded-lg bg-ui-bg-primary text-ui-text-primary">
              <SelectValue placeholder="All Epics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Epics</SelectItem>
              {epics.map((epic: RoadmapIssue) => (
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

      {/* Timeline Container */}
      <div className="flex-1 bg-ui-bg-primary rounded-lg border border-ui-border-primary overflow-hidden flex flex-col">
        {/* Timeline Header (Fixed) */}
        <div className="border-b border-ui-border-primary bg-ui-bg-secondary p-4 shrink-0">
          <div className="flex">
            <div className="w-64 shrink-0 font-medium text-ui-text-primary">Issue</div>
            <div className="flex-1 grid grid-cols-6">
              {timelineMonths.map((month) => (
                <div
                  key={month.getTime()}
                  className="text-center text-sm font-medium text-ui-text-primary border-l border-ui-border-primary px-2"
                >
                  {month.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Body (Virtualized) */}
        <div className="flex-1">
          {filteredIssues.length === 0 ? (
            <div className="p-12 text-center text-ui-text-secondary">
              <Typography>No issues with due dates to display</Typography>
              <Typography className="text-sm mt-1">
                Add due dates to issues to see them on the roadmap
              </Typography>
            </div>
          ) : (
            <List<RowData>
              listRef={listRef}
              style={{ height: 600, width: "100%" }}
              rowCount={filteredIssues.length}
              rowHeight={56}
              rowProps={{ issues: filteredIssues, selectedIndex }}
              rowComponent={Row}
            />
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
