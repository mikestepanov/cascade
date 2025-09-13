import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { KanbanBoard } from "./KanbanBoard";
import { SprintManager } from "./SprintManager";

interface ProjectBoardProps {
  projectId: Id<"projects">;
}

export function ProjectBoard({ projectId }: ProjectBoardProps) {
  const [activeTab, setActiveTab] = useState<"board" | "backlog" | "sprints">("board");
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

  const activeSprint = sprints?.find(sprint => sprint.status === "active");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded">
              {project.key}
            </span>
            <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded">
              {project.boardType}
            </span>
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
        </div>

        {/* Sprint Selector for Board */}
        {activeTab === "board" && project.boardType === "scrum" && (
          <div className="mt-4">
            <select
              value={selectedSprintId || ""}
              onChange={(e) => setSelectedSprintId(e.target.value ? e.target.value as Id<"sprints"> : undefined)}
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
          <KanbanBoard 
            projectId={projectId} 
            sprintId={selectedSprintId || activeSprint?._id}
          />
        )}
        {activeTab === "backlog" && (
          <KanbanBoard projectId={projectId} />
        )}
        {activeTab === "sprints" && (
          <SprintManager projectId={projectId} />
        )}
      </div>
    </div>
  );
}
