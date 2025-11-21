import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Checkbox, Input, Select, Textarea } from "./ui/form";

interface ProjectSidebarProps {
  selectedProjectId: Id<"projects"> | null;
  onSelectProject: (id: Id<"projects"> | null) => void;
}

export function ProjectSidebar({ selectedProjectId, onSelectProject }: ProjectSidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectKey, setNewProjectKey] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectIsPublic, setNewProjectIsPublic] = useState(false);
  const [newProjectBoardType, setNewProjectBoardType] = useState<"kanban" | "scrum">("kanban");

  const projects = useQuery(api.projects.list);
  const createProject = useMutation(api.projects.create);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(newProjectName.trim() && newProjectKey.trim())) return;

    try {
      const projectId = await createProject({
        name: newProjectName.trim(),
        key: newProjectKey.trim().toUpperCase(),
        description: newProjectDescription.trim() || undefined,
        isPublic: newProjectIsPublic,
        boardType: newProjectBoardType,
      });

      setNewProjectName("");
      setNewProjectKey("");
      setNewProjectDescription("");
      setNewProjectIsPublic(false);
      setNewProjectBoardType("kanban");
      setShowCreateForm(false);
      onSelectProject(projectId);
      showSuccess("Project created successfully");
    } catch (error) {
      showError(error, "Failed to create project");
    }
  };

  return (
    <div className="w-full sm:w-72 lg:w-64 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-r border-ui-border-primary dark:border-ui-border-primary-dark flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
        <h2 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
          Projects
        </h2>

        {/* Create Project Button */}
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="w-full px-3 py-2 bg-brand-600 dark:bg-brand-500 text-white rounded-md text-sm font-medium hover:bg-brand-700 dark:hover:bg-brand-600 transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
          <form onSubmit={(e) => void handleCreateProject(e)} className="space-y-3">
            <Input
              type="text"
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Project key (e.g., PROJ)"
              value={newProjectKey}
              onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())}
              maxLength={10}
            />
            <Textarea
              placeholder="Description (optional)..."
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows={2}
            />
            <Checkbox
              label="Make public"
              checked={newProjectIsPublic}
              onChange={(e) => setNewProjectIsPublic(e.target.checked)}
            />
            <Select
              value={newProjectBoardType}
              onChange={(e) => setNewProjectBoardType(e.target.value as "kanban" | "scrum")}
            >
              <option value="kanban">Kanban Board</option>
              <option value="scrum">Scrum Board</option>
            </Select>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-brand-600 dark:bg-brand-500 text-white rounded-md text-sm hover:bg-brand-700 dark:hover:bg-brand-600"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProjectName("");
                  setNewProjectKey("");
                  setNewProjectDescription("");
                  setNewProjectIsPublic(false);
                  setNewProjectBoardType("kanban");
                }}
                className="flex-1 px-3 py-2 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded-md text-sm hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {projects === undefined ? (
          <div className="p-4 text-center text-ui-text-secondary dark:text-ui-text-secondary-dark">
            Loading...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-4 text-center text-ui-text-secondary dark:text-ui-text-secondary-dark">
            No projects yet
          </div>
        ) : (
          <div className="p-2">
            {projects.map((project) => (
              <button
                key={project._id}
                type="button"
                className={`w-full text-left group p-3 rounded-md cursor-pointer transition-colors ${
                  selectedProjectId === project._id
                    ? "bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700"
                    : "hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark"
                }`}
                onClick={() => onSelectProject(project._id)}
                aria-label={`Select project ${project.name}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                        {project.name}
                      </h3>
                      <span className="text-xs bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark px-2 py-0.5 rounded">
                        {project.key}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        {project.issueCount} issues
                      </span>
                      <span className="text-xs bg-accent-100 dark:bg-accent-900/40 text-accent-800 dark:text-accent-400 px-2 py-0.5 rounded">
                        {project.boardType}
                      </span>
                      {project.isPublic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark">
                          Public
                        </span>
                      )}
                      {project.isOwner && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-400">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                      by {project.creatorName}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
