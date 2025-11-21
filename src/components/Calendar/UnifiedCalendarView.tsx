import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { CalendarView } from "./CalendarView";
import { RoadmapView } from "./RoadmapView";

interface UnifiedCalendarViewProps {
  projectId?: Id<"projects">;
}

type ViewType = "calendar" | "roadmap";

export function UnifiedCalendarView({ projectId }: UnifiedCalendarViewProps) {
  const [viewType, setViewType] = useState<ViewType>("calendar");

  return (
    <div className="flex flex-col h-full">
      {/* View Switcher */}
      <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark px-3 sm:px-6 py-3 bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            type="button"
            onClick={() => setViewType("calendar")}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              viewType === "calendar"
                ? "bg-brand-600 text-white"
                : "bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark"
            }`}
          >
            <span className="sm:hidden">📅 Calendar</span>
            <span className="hidden sm:inline">📅 Calendar (Events)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewType("roadmap")}
            disabled={!projectId}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              viewType === "roadmap"
                ? "bg-brand-600 text-white"
                : "bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark"
            } ${!projectId ? "opacity-50 cursor-not-allowed" : ""}`}
            title={!projectId ? "Select a project to view roadmap" : ""}
          >
            <span className="sm:hidden">🗺️ Roadmap</span>
            <span className="hidden sm:inline">🗺️ Roadmap (Issues)</span>
          </button>
        </div>
        {!projectId && viewType === "roadmap" && (
          <p className="text-xs sm:text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-2">
            Select a project from the sidebar to view the roadmap
          </p>
        )}
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {viewType === "calendar" ? (
          <CalendarView />
        ) : projectId ? (
          <RoadmapView projectId={projectId} />
        ) : (
          <div className="flex items-center justify-center h-full text-ui-text-secondary dark:text-ui-text-secondary-dark">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No Project Selected</p>
              <p className="text-sm">Select a project from the sidebar to view the roadmap</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
