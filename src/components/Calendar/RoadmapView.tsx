import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Flex } from "../ui/Flex";

interface RoadmapViewProps {
  projectId: Id<"projects">;
}

type TimeScale = "week" | "month" | "quarter";

export function RoadmapView({ projectId }: RoadmapViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range based on time scale
  const { startDate, endDate, columns } = getDateRange(currentDate, timeScale);

  // Fetch issues and sprints
  const issues = useQuery(api.issues.listByProject, { projectId });
  const sprints = useQuery(api.sprints.listByProject, { projectId });

  // Filter to items with dates
  const roadmapItems = [
    ...(sprints
      ?.filter(
        (sprint): sprint is typeof sprint & { startDate: number; endDate: number } =>
          sprint.startDate !== undefined && sprint.endDate !== undefined,
      )
      .map((sprint) => ({
        type: "sprint" as const,
        id: sprint._id,
        title: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        status: sprint.status,
      })) || []),
    ...(issues
      ?.filter((issue): issue is typeof issue & { dueDate: number } => issue.dueDate !== undefined)
      .map((issue) => ({
        type: "issue" as const,
        id: issue._id,
        title: `${issue.key}: ${issue.title}`,
        dueDate: issue.dueDate,
        startDate: issue.createdAt,
        endDate: issue.dueDate,
        issueType: issue.type,
        priority: issue.priority,
        status: issue.status,
      })) || []),
  ];

  // Sort by start date
  const sortedItems = roadmapItems.sort((a, b) => a.startDate - b.startDate);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (timeScale === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (timeScale === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 3);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (timeScale === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (timeScale === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 3);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderText = () => {
    if (timeScale === "week") {
      const endOfWeek = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else if (timeScale === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      const q = Math.floor(currentDate.getMonth() / 3) + 1;
      return `Q${q} ${currentDate.getFullYear()}`;
    }
  };

  return (
    <Flex direction="column" className="h-full bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
      {/* Header */}
      <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark p-3 sm:p-4">
        <Flex
          direction="column"
          gap="md"
          className="sm:flex-row items-stretch sm:items-center justify-between sm:gap-4"
        >
          <Flex gap="lg" align="center" className="gap-2 sm:gap-4">
            <button
              type="button"
              onClick={handleToday}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark dark:text-ui-text-primary-dark"
            >
              Today
            </button>
            <Flex gap="sm" align="center" className="gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="p-1 hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark rounded"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 dark:text-ui-text-primary-dark" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark rounded"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 dark:text-ui-text-primary-dark" />
              </button>
            </Flex>
            <h2 className="text-base sm:text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark truncate">
              {getHeaderText()}
            </h2>
          </Flex>

          {/* Time Scale Toggle */}
          <div className="flex border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md flex-shrink-0">
            <button
              type="button"
              onClick={() => setTimeScale("week")}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm ${
                timeScale === "week"
                  ? "bg-brand-600 text-white"
                  : "bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark"
              } rounded-l-md`}
            >
              <span className="sm:hidden">W</span>
              <span className="hidden sm:inline">Week</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeScale("month")}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm ${
                timeScale === "month"
                  ? "bg-brand-600 text-white"
                  : "bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark"
              } border-l border-ui-border-primary dark:border-ui-border-primary-dark`}
            >
              <span className="sm:hidden">M</span>
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeScale("quarter")}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm ${
                timeScale === "quarter"
                  ? "bg-brand-600 text-white"
                  : "bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark"
              } rounded-r-md border-l border-ui-border-primary dark:border-ui-border-primary-dark`}
            >
              <span className="sm:hidden">Q</span>
              <span className="hidden sm:inline">Quarter</span>
            </button>
          </div>
        </Flex>
      </div>

      {/* Roadmap Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Timeline Header */}
          <div className="sticky top-0 z-10 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark">
            <div className="flex">
              <div className="w-40 sm:w-48 md:w-64 flex-shrink-0 p-2 sm:p-3 border-r border-ui-border-primary dark:border-ui-border-primary-dark font-medium text-xs sm:text-sm text-ui-text-primary dark:text-ui-text-primary-dark">
                Item
              </div>
              <div className="flex-1 flex">
                {columns.map((col) => (
                  <div
                    key={col.date.getTime()}
                    className="flex-1 p-2 sm:p-3 border-r border-ui-border-primary dark:border-ui-border-primary-dark text-center text-xs sm:text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark"
                  >
                    {col.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Roadmap Items */}
          {sortedItems.length === 0 ? (
            <div className="p-4 sm:p-8 text-center text-sm sm:text-base text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              No items with dates found. Add due dates to issues or create sprints to see them here.
            </div>
          ) : (
            <div>
              {sortedItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex border-b border-ui-border-primary dark:border-ui-border-primary-dark"
                >
                  {/* Item Info */}
                  <div className="w-40 sm:w-48 md:w-64 flex-shrink-0 p-2 sm:p-3 border-r border-ui-border-primary dark:border-ui-border-primary-dark">
                    <Flex gap="sm" align="center" className="gap-1 sm:gap-2">
                      {item.type === "sprint" ? (
                        <Badge variant="accent" size="md">
                          Sprint
                        </Badge>
                      ) : (
                        <Badge variant={getIssueTypeVariant(item.issueType)} size="md">
                          {item.issueType}
                        </Badge>
                      )}
                    </Flex>
                    <div className="text-xs sm:text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mt-1 truncate">
                      {item.title}
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 flex">
                      {columns.map((col) => (
                        <div
                          key={col.date.getTime()}
                          className="flex-1 border-r border-ui-border-primary dark:border-ui-border-primary-dark"
                        />
                      ))}
                    </div>

                    {/* Date Bar */}
                    <div className="absolute inset-y-0 flex items-center px-2">
                      {renderDateBar(item, startDate, endDate, columns.length)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Flex>
  );
}

// Render a date bar for an item
function renderDateBar(
  item: { startDate: number; endDate: number },
  rangeStart: Date,
  rangeEnd: Date,
  _columnCount: number,
) {
  const itemStart = new Date(item.startDate);
  const itemEnd = new Date(item.endDate);

  const rangeStartTime = rangeStart.getTime();
  const rangeEndTime = rangeEnd.getTime();
  const rangeDuration = rangeEndTime - rangeStartTime;

  const itemStartTime = Math.max(itemStart.getTime(), rangeStartTime);
  const itemEndTime = Math.min(itemEnd.getTime(), rangeEndTime);

  // Item is outside visible range
  if (itemEndTime <= rangeStartTime || itemStartTime >= rangeEndTime) {
    return null;
  }

  const leftPercent = ((itemStartTime - rangeStartTime) / rangeDuration) * 100;
  const widthPercent = ((itemEndTime - itemStartTime) / rangeDuration) * 100;

  const color =
    item.type === "sprint"
      ? "bg-accent-500"
      : item.priority === "highest" || item.priority === "high"
        ? "bg-status-error"
        : item.priority === "medium"
          ? "bg-status-warning"
          : "bg-brand-500";

  return (
    <div
      className={`${color} rounded-full h-6 flex items-center justify-center text-white text-xs font-medium overflow-hidden whitespace-nowrap px-2`}
      style={{
        marginLeft: `${leftPercent}%`,
        width: `${widthPercent}%`,
        minWidth: "40px",
      }}
    >
      {itemStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
      {itemEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
    </div>
  );
}

// Get date range and columns
function getDateRange(currentDate: Date, timeScale: TimeScale) {
  if (timeScale === "week") {
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const columns = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return {
        label: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        date,
      };
    });

    return { startDate, endDate, columns };
  } else if (timeScale === "month") {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();

    // Show weeks for month view
    const weeks = Math.ceil(daysInMonth / 7);
    const columns = Array.from({ length: weeks }, (_, i) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(1 + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return {
        label: `Week ${i + 1}`,
        date: weekStart,
      };
    });

    return { startDate, endDate, columns };
  } else {
    // Quarter
    const quarterStart = Math.floor(currentDate.getMonth() / 3) * 3;
    const startDate = new Date(currentDate.getFullYear(), quarterStart, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentDate.getFullYear(), quarterStart + 3, 1);

    const columns = [
      {
        label: new Date(currentDate.getFullYear(), quarterStart, 1).toLocaleDateString("en-US", {
          month: "short",
        }),
        date: new Date(currentDate.getFullYear(), quarterStart, 1),
      },
      {
        label: new Date(currentDate.getFullYear(), quarterStart + 1, 1).toLocaleDateString(
          "en-US",
          { month: "short" },
        ),
        date: new Date(currentDate.getFullYear(), quarterStart + 1, 1),
      },
      {
        label: new Date(currentDate.getFullYear(), quarterStart + 2, 1).toLocaleDateString(
          "en-US",
          { month: "short" },
        ),
        date: new Date(currentDate.getFullYear(), quarterStart + 2, 1),
      },
    ];

    return { startDate, endDate, columns };
  }
}

// Get issue type variant for Badge component
function getIssueTypeVariant(
  type: string,
):
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral"
  | "brand"
  | "accent" {
  switch (type) {
    case "epic":
      return "accent";
    case "story":
      return "success";
    case "task":
      return "brand";
    case "bug":
      return "error";
    default:
      return "neutral";
  }
}
