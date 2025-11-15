import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { KanbanBoard } from "./KanbanBoard";
import { SprintManager } from "./SprintManager";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { RoadmapView } from "./RoadmapView";
import { CalendarView } from "./CalendarView";
import { ActivityFeed } from "./ActivityFeed";
import { ExportButton } from "./ExportButton";
import { LabelsManager } from "./LabelsManager";
import { TemplatesManager } from "./TemplatesManager";
import { WebhooksManager } from "./WebhooksManager";
import { AutomationRulesManager } from "./AutomationRulesManager";
import { CustomFieldsManager } from "./CustomFieldsManager";
import { ErrorBoundary } from "./ErrorBoundary";
import { SectionErrorFallback } from "./SectionErrorFallback";

interface ProjectBoardProps {
  projectId: Id<"projects">;
}

export function ProjectBoard({ projectId }: ProjectBoardProps) {
  const [activeTab, setActiveTab] = useState<
    "board" | "backlog" | "sprints" | "roadmap" | "calendar" | "activity" | "analytics" | "settings"
  >("board");
  const [selectedSprintId, setSelectedSprintId] = useState<Id<"sprints"> | undefined>();

  const project = useQuery(api.projects.get, { id: projectId });
  const sprints = useQuery(api.sprints.listByProject, { projectId });

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const activeSprint = sprints?.find((sprint) => sprint.status === "active");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButton
              projectId={projectId}
              sprintId={activeTab === "board" ? selectedSprintId || activeSprint?._id : undefined}
            />
            <div className="flex items-center space-x-2">
              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded">
                {project.key}
              </span>
              <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded">
                {project.boardType}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab("board")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "board"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setActiveTab("backlog")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "backlog"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Backlog
          </button>
          {project.boardType === "scrum" && (
            <button
              onClick={() => setActiveTab("sprints")}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === "sprints"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Sprints
            </button>
          )}
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "roadmap"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🗺️ Roadmap
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "calendar"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "activity"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🔔 Activity
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Sprint Selector for Board */}
        {activeTab === "board" && project.boardType === "scrum" && (
          <div className="mt-4">
            <select
              value={selectedSprintId || ""}
              onChange={(e) =>
                setSelectedSprintId(e.target.value ? (e.target.value as Id<"sprints">) : undefined)
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Active Sprint</option>
              {sprints?.map((sprint) => (
                <option key={sprint._id} value={sprint._id}>
                  {sprint.name} ({sprint.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "board" && (
          <KanbanBoard projectId={projectId} sprintId={selectedSprintId || activeSprint?._id} />
        )}
        {activeTab === "backlog" && <KanbanBoard projectId={projectId} />}
        {activeTab === "sprints" && <SprintManager projectId={projectId} />}
        {activeTab === "roadmap" && (
          <RoadmapView projectId={projectId} sprintId={selectedSprintId || activeSprint?._id} />
        )}
        {activeTab === "calendar" && (
          <CalendarView projectId={projectId} sprintId={selectedSprintId || activeSprint?._id} />
        )}
        {activeTab === "activity" && (
          <div className="p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Project Activity
              </h2>
              <ActivityFeed projectId={projectId} />
            </div>
          </div>
        )}
        {activeTab === "analytics" && <AnalyticsDashboard projectId={projectId} />}
        {activeTab === "settings" && (
          <div className="p-6 overflow-y-auto">
            <div className="max-w-4xl space-y-6">
              <ErrorBoundary
                fallback={<SectionErrorFallback title="Labels Error" />}
                onError={(error) => console.error("LabelsManager error:", error)}
              >
                <LabelsManager projectId={projectId} />
              </ErrorBoundary>

              <ErrorBoundary
                fallback={<SectionErrorFallback title="Templates Error" />}
                onError={(error) => console.error("TemplatesManager error:", error)}
              >
                <TemplatesManager projectId={projectId} />
              </ErrorBoundary>

              <ErrorBoundary
                fallback={<SectionErrorFallback title="Webhooks Error" />}
                onError={(error) => console.error("WebhooksManager error:", error)}
              >
                <WebhooksManager projectId={projectId} />
              </ErrorBoundary>

              <ErrorBoundary
                fallback={<SectionErrorFallback title="Automation Error" />}
                onError={(error) => console.error("AutomationRulesManager error:", error)}
              >
                <AutomationRulesManager projectId={projectId} />
              </ErrorBoundary>

              <ErrorBoundary
                fallback={<SectionErrorFallback title="Custom Fields Error" />}
                onError={(error) => console.error("CustomFieldsManager error:", error)}
              >
                <CustomFieldsManager projectId={projectId} />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
