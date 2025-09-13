import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface SprintManagerProps {
  projectId: Id<"projects">;
}

export function SprintManager({ projectId }: SprintManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");

  const sprints = useQuery(api.sprints.listByProject, { projectId });
  const createSprint = useMutation(api.sprints.create);
  const startSprint = useMutation(api.sprints.startSprint);
  const completeSprint = useMutation(api.sprints.completeSprint);

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    try {
      await createSprint({
        projectId,
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || undefined,
      });

      setNewSprintName("");
      setNewSprintGoal("");
      setShowCreateForm(false);
      toast.success("Sprint created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create sprint");
    }
  };

  const handleStartSprint = async (sprintId: Id<"sprints">) => {
    const startDate = Date.now();
    const endDate = startDate + (14 * 24 * 60 * 60 * 1000); // 2 weeks

    try {
      await startSprint({
        sprintId,
        startDate,
        endDate,
      });
      toast.success("Sprint started successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to start sprint");
    }
  };

  const handleCompleteSprint = async (sprintId: Id<"sprints">) => {
    try {
      await completeSprint({ sprintId });
      toast.success("Sprint completed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete sprint");
    }
  };

  if (!sprints) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Sprint Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Sprint
        </button>
      </div>

      {/* Create Sprint Form */}
      {showCreateForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <form onSubmit={handleCreateSprint} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sprint Name
              </label>
              <input
                type="text"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Sprint 1"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sprint Goal (Optional)
              </label>
              <textarea
                value={newSprintGoal}
                onChange={(e) => setNewSprintGoal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="What do you want to achieve in this sprint?"
                rows={2}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Sprint
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSprintName("");
                  setNewSprintGoal("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sprints List */}
      <div className="space-y-4">
        {sprints.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No sprints created yet. Create your first sprint to get started.
          </div>
        ) : (
          sprints.map((sprint) => (
            <div
              key={sprint._id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {sprint.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        sprint.status === "active"
                          ? "bg-green-100 text-green-800"
                          : sprint.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {sprint.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {sprint.issueCount} issues
                    </span>
                  </div>
                  {sprint.goal && (
                    <p className="text-gray-600 mb-2">{sprint.goal}</p>
                  )}
                  {sprint.startDate && sprint.endDate && (
                    <p className="text-sm text-gray-500">
                      {new Date(sprint.startDate).toLocaleDateString()} -{" "}
                      {new Date(sprint.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {sprint.status === "future" && (
                    <button
                      onClick={() => handleStartSprint(sprint._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Start Sprint
                    </button>
                  )}
                  {sprint.status === "active" && (
                    <button
                      onClick={() => handleCompleteSprint(sprint._id)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Complete Sprint
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
