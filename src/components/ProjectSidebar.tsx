import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
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
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="primary"
          size="sm"
          className="w-full"
        >
          + New Project
        </Button>
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
              <Button type="submit" variant="primary" size="sm" className="flex-1">
                Create
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProjectName("");
                  setNewProjectKey("");
                  setNewProjectDescription("");
                  setNewProjectIsPublic(false);
                  setNewProjectBoardType("kanban");
                }}
              >
                Cancel
              </Button>
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
                      <Badge variant="neutral">{project.key}</Badge>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        {project.issueCount} issues
                      </span>
                      <Badge variant="accent">{project.boardType}</Badge>
                      {project.isPublic && <Badge variant="success">Public</Badge>}
                      {project.isOwner && <Badge variant="primary">Owner</Badge>}
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
