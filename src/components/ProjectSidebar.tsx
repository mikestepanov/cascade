import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

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
    } catch (error: any) {
      toast.error(error.message || "Failed to create project");
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
        
        {/* Create Project Button */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={(e) => void handleCreateProject(e)} className="space-y-3">
            <input
              type="text"
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="Project key (e.g., PROJ)"
              value={newProjectKey}
              onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={10}
            />
            <textarea
              placeholder="Description (optional)..."
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={newProjectIsPublic}
                onChange={(e) => setNewProjectIsPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make public
              </label>
            </div>
            <select
              value={newProjectBoardType}
              onChange={(e) => setNewProjectBoardType(e.target.value as "kanban" | "scrum")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="kanban">Kanban Board</option>
              <option value="scrum">Scrum Board</option>
            </select>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
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
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
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
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No projects yet</div>
        ) : (
          <div className="p-2">
            {projects.map((project) => (
              <div
                key={project._id}
                className={`group p-3 rounded-md cursor-pointer transition-colors ${
                  selectedProjectId === project._id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => onSelectProject(project._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {project.name}
                      </h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {project.key}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-gray-500">
                        {project.issueCount} issues
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        {project.boardType}
                      </span>
                      {project.isPublic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Public
                        </span>
                      )}
                      {project.isOwner && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
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
