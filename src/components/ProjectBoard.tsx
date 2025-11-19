import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ActivityFeed } from "./ActivityFeed";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { AutomationRulesManager } from "./AutomationRulesManager";
import { CalendarView } from "./CalendarView";
import { CustomFieldsManager } from "./CustomFieldsManager";
import { ErrorBoundary } from "./ErrorBoundary";
import { ExportButton } from "./ExportButton";
import { KanbanBoard } from "./KanbanBoard";
import { LabelsManager } from "./LabelsManager";
import { RoadmapView } from "./RoadmapView";
import { SectionErrorFallback } from "./SectionErrorFallback";
import { SprintManager } from "./SprintManager";
import { TemplatesManager } from "./TemplatesManager";
import { BillingReport } from "./TimeTracker/BillingReport";
import { SkeletonText } from "./ui/Skeleton";
import { WebhooksManager } from "./WebhooksManager";

interface ProjectBoardProps {
  projectId: Id<"projects">;
}

export function ProjectBoard({ projectId }: ProjectBoardProps) {
  const [activeTab, setActiveTab] = useState<
    | "board"
    | "backlog"
    | "sprints"
    | "roadmap"
    | "calendar"
    | "activity"
    | "analytics"
    | "billing"
    | "settings"
  >("board");
  const [selectedSprintId, setSelectedSprintId] = useState<Id<"sprints"> | undefined>();

  const project = useQuery(api.projects.get, { id: projectId });
  const sprints = useQuery(api.sprints.listByProject, { projectId });

  if (!project) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="border-b border-gray-200 p-6">
          <div className="space-y-4">
            <SkeletonText lines={2} />
            <div className="flex space-x-6">
              <SkeletonText lines={1} className="w-32" />
              <SkeletonText lines={1} className="w-32" />
              <SkeletonText lines={1} className="w-32" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <SkeletonText lines={4} />
        </div>
      </div>
    );
  }

  const activeSprint = sprints?.find((sprint) => sprint.status === "active");

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">{project.description}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ExportButton
              projectId={projectId}
              sprintId={activeTab === "board" ? selectedSprintId || activeSprint?._id : undefined}
            />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded">
                {project.key}
              </span>
              <span className="text-xs sm:text-sm bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded">
                {project.boardType}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs - Visually grouped by function */}
        <div className="flex items-center overflow-x-auto -webkit-overflow-scrolling-touch scrollbar-hide">
          {/* Primary Workflow Tabs */}
          <div className="flex gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("board")}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${
                activeTab === "board"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("backlog")}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${
                activeTab === "backlog"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Backlog
            </button>
            {project.boardType === "scrum" && (
              <button
                type="button"
                onClick={() => setActiveTab("sprints")}
                className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === "sprints"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Sprints
              </button>
            )}
          </div>

          {/* Visual Separator */}
          <div className="hidden lg:block h-6 w-px bg-gray-300 mx-4 sm:mx-6" />

          {/* Analysis & Views Tabs */}
          <div className="flex space-x-4 sm:space-x-6 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("roadmap")}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === "roadmap"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === "calendar"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === "activity"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Activity
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === "billing"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              💰 Billing
            </button>
          </div>

          {/* Spacer to push Settings to the right */}
          <div className="flex-1" />

          {/* Settings Tab - Separated */}
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
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
        {activeTab === "billing" && <BillingReport projectId={projectId} />}
        {activeTab === "settings" && (
          <div className="p-6 overflow-y-auto bg-gray-50">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Project Basics Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Project Basics</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure fundamental project settings and templates
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ErrorBoundary
                    fallback={<SectionErrorFallback title="Labels Error" />}
                    onError={(_error) => {}}
                  >
                    <LabelsManager projectId={projectId} />
                  </ErrorBoundary>

                  <ErrorBoundary
                    fallback={<SectionErrorFallback title="Templates Error" />}
                    onError={(_error) => {}}
                  >
                    <TemplatesManager projectId={projectId} />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Integrations & Automation Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Integrations & Automation
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connect external services and automate workflows
                </p>
                <div className="space-y-6">
                  <ErrorBoundary
                    fallback={<SectionErrorFallback title="Webhooks Error" />}
                    onError={(_error) => {}}
                  >
                    <WebhooksManager projectId={projectId} />
                  </ErrorBoundary>

                  <ErrorBoundary
                    fallback={<SectionErrorFallback title="Automation Error" />}
                    onError={(_error) => {}}
                  >
                    <AutomationRulesManager projectId={projectId} />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Advanced Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Advanced</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Customize your project with additional metadata fields
                </p>
                <ErrorBoundary
                  fallback={<SectionErrorFallback title="Custom Fields Error" />}
                  onError={(_error) => {}}
                >
                  <CustomFieldsManager projectId={projectId} />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
