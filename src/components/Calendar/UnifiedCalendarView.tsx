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
      <div className="border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 bg-white dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => setViewType("calendar")}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              viewType === "calendar"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <span className="sm:hidden">📅 Calendar</span>
            <span className="hidden sm:inline">📅 Calendar (Events)</span>
          </button>
          <button
            onClick={() => setViewType("roadmap")}
            disabled={!projectId}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              viewType === "roadmap"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            } ${!projectId ? "opacity-50 cursor-not-allowed" : ""}`}
            title={!projectId ? "Select a project to view roadmap" : ""}
          >
            <span className="sm:hidden">🗺️ Roadmap</span>
            <span className="hidden sm:inline">🗺️ Roadmap (Issues)</span>
          </button>
        </div>
        {!projectId && viewType === "roadmap" && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
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
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
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
