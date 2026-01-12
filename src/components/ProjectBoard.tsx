import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
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
import { Badge } from "./ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { SkeletonText } from "./ui/Skeleton";
import { Typography } from "./ui/Typography";
import { WebhooksManager } from "./WebhooksManager";

interface ProjectBoardProps {
  projectId: Id<"projects">;
}

type TabType =
  | "board"
  | "backlog"
  | "sprints"
  | "roadmap"
  | "calendar"
  | "activity"
  | "analytics"
  | "billing"
  | "settings";

// Tab button component to reduce repetition
function TabButton({
  activeTab,
  tab,
  icon,
  label,
  onClick,
}: {
  activeTab: TabType;
  tab: TabType;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  const isActive = activeTab === tab;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pb-2 px-2 sm:px-0 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 text-sm sm:text-base flex items-center gap-1.5",
        isActive
          ? "border-brand-600 text-brand-600 dark:text-brand-500"
          : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark",
      )}
      aria-label={`${label} view`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// Component to render active tab content
function TabContent({
  activeTab,
  projectId,
  selectedSprintId,
  activeSprint,
  canEdit,
}: {
  activeTab: TabType;
  projectId: Id<"projects">;
  selectedSprintId?: Id<"sprints">;
  activeSprint?: Id<"sprints">;
  canEdit: boolean;
}) {
  const sprintId = selectedSprintId || activeSprint;

  if (activeTab === "board") {
    return <KanbanBoard projectId={projectId} sprintId={sprintId} />;
  }
  if (activeTab === "backlog") {
    return <KanbanBoard projectId={projectId} />;
  }
  if (activeTab === "sprints") {
    return <SprintManager projectId={projectId} canEdit={canEdit} />;
  }
  if (activeTab === "roadmap") {
    return <RoadmapView projectId={projectId} sprintId={sprintId} canEdit={canEdit} />;
  }
  if (activeTab === "calendar") {
    return <CalendarView projectId={projectId} sprintId={sprintId} canEdit={canEdit} />;
  }
  if (activeTab === "activity") {
    return (
      <div className="p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-ui-text-primary dark:text-ui-text-primary-dark">
            Project Activity
          </h2>
          <ActivityFeed projectId={projectId} />
        </div>
      </div>
    );
  }
  if (activeTab === "analytics") {
    return (
      <ErrorBoundary
        fallback={<SectionErrorFallback title="Analytics Error" />}
        onError={(_error) => {
          // Error is shown in fallback UI
        }}
      >
        <AnalyticsDashboard projectId={projectId} />
      </ErrorBoundary>
    );
  }
  if (activeTab === "billing") {
    return <BillingReport projectId={projectId} />;
  }
  if (activeTab === "settings") {
    return (
      <div className="p-3 sm:p-6 overflow-y-auto bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Project Basics Section */}
          <div>
            <Typography
              variant="h3"
              className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Project Basics
            </Typography>
            <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
              Configure fundamental project settings and templates
            </Typography>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ErrorBoundary
                fallback={<SectionErrorFallback title="Labels Error" />}
                onError={(_error) => {
                  // Error is shown in fallback UI
                }}
              >
                <LabelsManager projectId={projectId} />
              </ErrorBoundary>

              <ErrorBoundary
                fallback={<SectionErrorFallback title="Templates Error" />}
                onError={(_error) => {
                  // Error is shown in fallback UI
                }}
              >
                <TemplatesManager projectId={projectId} />
              </ErrorBoundary>
            </div>
          </div>

          {/* Integrations & Automation Section */}
          <div>
            <Typography
              variant="h3"
              className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Integrations & Automation
            </Typography>
            <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
              Connect external services and automate workflows
            </Typography>
            <div className="space-y-6">
              <ErrorBoundary
                fallback={<SectionErrorFallback title="Webhooks Error" />}
                onError={(_error) => {
                  // Error is shown in fallback UI
                }}
              >
                <WebhooksManager projectId={projectId} />
              </ErrorBoundary>

              <ErrorBoundary
                fallback={<SectionErrorFallback title="Automation Error" />}
                onError={(_error) => {
                  // Error is shown in fallback UI
                }}
              >
                <AutomationRulesManager projectId={projectId} />
              </ErrorBoundary>
            </div>
          </div>

          {/* Advanced Section */}
          <div>
            <Typography
              variant="h3"
              className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Advanced
            </Typography>
            <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
              Customize your project with additional metadata fields
            </Typography>
            <ErrorBoundary
              fallback={<SectionErrorFallback title="Custom Fields Error" />}
              onError={(_error) => {
                // Error is shown in fallback UI
              }}
            >
              <CustomFieldsManager projectId={projectId} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function ProjectBoard({ projectId }: ProjectBoardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("board");
  const [selectedSprintId, setSelectedSprintId] = useState<Id<"sprints"> | undefined>();

  const project = useQuery(api.projects.getProject, { id: projectId });
  const sprints = useQuery(api.sprints.listByProject, { projectId });

  if (!project) {
    return (
      <div className="flex flex-col h-full bg-ui-bg-primary">
        <div className="border-b border-ui-border-primary p-6">
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

  const activeSprint = sprints?.find((sprint: Doc<"sprints">) => sprint.status === "active");

  return (
    <div className="flex flex-col h-full bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
      <div data-testid="debug-user-role" data-role={project.userRole} style={{ display: "none" }}>
        {project.userRole}
      </div>
      {/* Header */}
      <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex-1">
            <Typography
              variant="h1"
              className="text-xl sm:text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark"
            >
              {project.name}
            </Typography>
            <Typography className="text-sm sm:text-base text-ui-text-secondary dark:text-ui-text-secondary-dark truncate">
              {project.description}
            </Typography>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ExportButton
              projectId={projectId}
              sprintId={activeTab === "board" ? selectedSprintId || activeSprint?._id : undefined}
            />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Badge variant="neutral" size="md">
                {project.key}
              </Badge>
              <Badge variant="accent" size="md">
                {project.boardType}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs - Visually grouped by function */}
        <div className="flex items-center overflow-x-auto -webkit-overflow-scrolling-touch scrollbar-hide">
          {/* Primary Workflow Tabs */}
          <div className="flex gap-2 sm:gap-3 md:gap-6">
            <TabButton
              activeTab={activeTab}
              tab="board"
              icon="📋"
              label="Board"
              onClick={() => setActiveTab("board")}
            />
            <TabButton
              activeTab={activeTab}
              tab="backlog"
              icon="📝"
              label="Backlog"
              onClick={() => setActiveTab("backlog")}
            />
            {project.boardType === "scrum" && (
              <TabButton
                activeTab={activeTab}
                tab="sprints"
                icon="🏃"
                label="Sprints"
                onClick={() => setActiveTab("sprints")}
              />
            )}
          </div>

          {/* Visual Separator */}
          <div className="hidden lg:block h-6 w-px bg-ui-border-primary dark:bg-ui-border-primary-dark mx-2 sm:mx-4 md:mx-6" />

          {/* Analysis & Views Tabs */}
          <div className="flex gap-2 sm:gap-3 md:gap-6 flex-shrink-0">
            <TabButton
              activeTab={activeTab}
              tab="roadmap"
              icon="🗺️"
              label="Roadmap"
              onClick={() => setActiveTab("roadmap")}
            />
            <TabButton
              activeTab={activeTab}
              tab="calendar"
              icon="📅"
              label="Calendar"
              onClick={() => setActiveTab("calendar")}
            />
            <TabButton
              activeTab={activeTab}
              tab="activity"
              icon="📊"
              label="Activity"
              onClick={() => setActiveTab("activity")}
            />
            <TabButton
              activeTab={activeTab}
              tab="analytics"
              icon="📈"
              label="Analytics"
              onClick={() => setActiveTab("analytics")}
            />
            <TabButton
              activeTab={activeTab}
              tab="billing"
              icon="💰"
              label="Billing"
              onClick={() => setActiveTab("billing")}
            />
          </div>

          {/* Spacer to push Settings to the right */}
          <div className="flex-1" />

          {/* Settings Tab - Separated */}
          {project.userRole === "admin" && (
            <TabButton
              activeTab={activeTab}
              tab="settings"
              icon="⚙️"
              label="Settings"
              onClick={() => setActiveTab("settings")}
            />
          )}
        </div>

        {/* Sprint Selector for Board */}
        {activeTab === "board" && project.boardType === "scrum" && (
          <div className="mt-4">
            <Select
              value={selectedSprintId || "active"}
              onValueChange={(value) =>
                setSelectedSprintId(value === "active" ? undefined : (value as Id<"sprints">))
              }
            >
              <SelectTrigger className="px-3 py-2 border border-ui-border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ui-border-focus">
                <SelectValue placeholder="Active Sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Sprint</SelectItem>
                {sprints?.map((sprint: Doc<"sprints">) => (
                  <SelectItem key={sprint._id} value={sprint._id}>
                    {sprint.name} ({sprint.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <TabContent
          activeTab={activeTab}
          projectId={projectId}
          selectedSprintId={selectedSprintId}
          activeSprint={activeSprint?._id}
          canEdit={project.userRole !== "viewer"}
        />
      </div>
    </div>
  );
}
