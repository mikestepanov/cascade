import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Flex } from "../ui/Flex";
import { ToggleGroup, ToggleGroupItem } from "../ui/ToggleGroup";
import { Typography } from "../ui/Typography";
import { CalendarView } from "./CalendarView";
import { RoadmapView } from "./RoadmapView";

interface UnifiedCalendarViewProps {
  projectId?: Id<"projects">;
}

type ViewType = "calendar" | "roadmap";

export function UnifiedCalendarView({ projectId }: UnifiedCalendarViewProps) {
  const [viewType, setViewType] = useState<ViewType>("calendar");

  return (
    <Flex direction="column" className="h-full">
      {/* View Switcher */}
      <div className="border-b border-ui-border-primary px-3 sm:px-6 py-3 bg-ui-bg-primary">
        <ToggleGroup
          type="single"
          value={viewType}
          onValueChange={(value) => value && setViewType(value as ViewType)}
          variant="brand"
        >
          <ToggleGroupItem value="calendar">
            <span className="sm:hidden">📅 Calendar</span>
            <span className="hidden sm:inline">📅 Calendar (Events)</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="roadmap"
            disabled={!projectId}
            title={!projectId ? "Select a project to view roadmap" : ""}
          >
            <span className="sm:hidden">🗺️ Roadmap</span>
            <span className="hidden sm:inline">🗺️ Roadmap (Issues)</span>
          </ToggleGroupItem>
        </ToggleGroup>
        {!projectId && viewType === "roadmap" && (
          <Typography variant="muted" className="text-xs sm:text-sm mt-2">
            Select a project from the sidebar to view the roadmap
          </Typography>
        )}
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {viewType === "calendar" ? (
          <CalendarView />
        ) : projectId ? (
          <RoadmapView projectId={projectId} />
        ) : (
          <Flex justify="center" align="center" className="h-full text-ui-text-secondary">
            <div className="text-center">
              <Typography variant="p" className="text-lg font-medium mb-2">
                No Project Selected
              </Typography>
              <Typography variant="p" className="text-sm">
                Select a project from the sidebar to view the roadmap
              </Typography>
            </div>
          </Flex>
        )}
      </div>
    </Flex>
  );
}
