import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { IssueCard } from "./IssueCard";
import { CreateIssueModal } from "./CreateIssueModal";

interface KanbanBoardProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
}

export function KanbanBoard({ projectId, sprintId }: KanbanBoardProps) {
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [createIssueStatus, setCreateIssueStatus] = useState<string>("");
  const [draggedIssue, setDraggedIssue] = useState<Id<"issues"> | null>(null);

  const project = useQuery(api.projects.get, { id: projectId });
  const issues = useQuery(api.issues.listByProject, { projectId, sprintId });
  const updateIssueStatus = useMutation(api.issues.updateStatus);

  if (!project || !issues) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const workflowStates = project.workflowStates.sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent, issueId: Id<"issues">) => {
    setDraggedIssue(issueId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedIssue) return;

    const issuesInNewStatus = issues.filter(issue => issue.status === newStatus);
    const newOrder = Math.max(...issuesInNewStatus.map(i => i.order), -1) + 1;

    try {
      await updateIssueStatus({
        issueId: draggedIssue,
        newStatus,
        newOrder,
      });
    } catch (error) {
      toast.error("Failed to update issue status");
    }

    setDraggedIssue(null);
  };

  const handleCreateIssue = (status: string) => {
    setCreateIssueStatus(status);
    setShowCreateIssue(true);
  };

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex space-x-6 p-6 min-w-max">
        {workflowStates.map((state) => {
          const stateIssues = issues
            .filter(issue => issue.status === state.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={state.id}
              className="flex-shrink-0 w-80 bg-gray-50 rounded-lg"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, state.id)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{state.name}</h3>
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                      {stateIssues.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCreateIssue(state.id)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Add issue"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Issues */}
              <div className="p-2 space-y-2 min-h-96">
                {stateIssues.map((issue) => (
                  <IssueCard
                    key={issue._id}
                    issue={issue}
                    onDragStart={(e) => handleDragStart(e, issue._id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateIssue && (
        <CreateIssueModal
          projectId={projectId}
          sprintId={sprintId}
          defaultStatus={createIssueStatus}
          onClose={() => {
            setShowCreateIssue(false);
            setCreateIssueStatus("");
          }}
        />
      )}
    </div>
  );
}
