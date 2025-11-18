import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { handleKeyboardClick } from "@/lib/accessibility";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Input, Select, Textarea, Checkbox } from "./ui/form";

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
    if (!newProjectName.trim() || !newProjectKey.trim()) return;

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
      toast.success("Project created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    }
  };

  return (
    <div className="w-full sm:w-96 lg:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Projects</h2>

        {/* Create Project Button */}
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="w-full px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
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
                className="flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm hover:bg-blue-700 dark:hover:bg-blue-600"
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
                className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-400 dark:hover:bg-gray-600"
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
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">No projects yet</div>
        ) : (
          <div className="p-2">
            {projects.map((project) => (
              <div
                key={project._id}
                role="button"
                tabIndex={0}
                className={`group p-3 rounded-md cursor-pointer transition-colors ${
                  selectedProjectId === project._id
                    ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => onSelectProject(project._id)}
                onKeyDown={handleKeyboardClick(() => onSelectProject(project._id))}
                aria-label={`Select project ${project.name}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {project.name}
                      </h3>
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                        {project.key}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {project.issueCount} issues
                      </span>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400 px-2 py-0.5 rounded">
                        {project.boardType}
                      </span>
                      {project.isPublic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400">
                          Public
                        </span>
                      )}
                      {project.isOwner && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      by {project.creatorName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
