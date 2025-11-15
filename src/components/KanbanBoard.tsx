import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { IssueCard } from "./IssueCard";
import { CreateIssueModal } from "./CreateIssueModal";
import { IssueDetailModal } from "./IssueDetailModal";
import { BulkOperationsBar } from "./BulkOperationsBar";

interface KanbanBoardProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
}

export function KanbanBoard({ projectId, sprintId }: KanbanBoardProps) {
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [createIssueStatus, setCreateIssueStatus] = useState<string>("");
  const [draggedIssue, setDraggedIssue] = useState<Id<"issues"> | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<Id<"issues">>>(new Set());

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
    } catch {
      toast.error("Failed to update issue status");
    }

    setDraggedIssue(null);
  };

  const handleCreateIssue = (status: string) => {
    setCreateIssueStatus(status);
    setShowCreateIssue(true);
  };

  const handleToggleSelect = (issueId: Id<"issues">) => {
    setSelectedIssueIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedIssueIds(new Set());
    setSelectionMode(false);
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIssueIds(new Set());
    }
  };

  return (
    <div className="flex-1 overflow-x-auto">
      {/* Header with bulk operations toggle */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {sprintId ? "Sprint Board" : "Kanban Board"}
        </h2>
        <button
          onClick={handleToggleSelectionMode}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectionMode
              ? "bg-primary text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {selectionMode ? "Exit Selection Mode" : "Select Multiple"}
        </button>
      </div>

      <div className="flex space-x-6 px-6 pb-6 min-w-max">
        {workflowStates.map((state) => {
          const stateIssues = issues
            .filter(issue => issue.status === state.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={state.id}
              className="flex-shrink-0 w-80 bg-gray-50 rounded-lg"
              onDragOver={handleDragOver}
              onDrop={(e) => void handleDrop(e, state.id)}
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
                    onClick={() => !selectionMode && setSelectedIssue(issue._id)}
                    selectionMode={selectionMode}
                    isSelected={selectedIssueIds.has(issue._id)}
                    onToggleSelect={handleToggleSelect}
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

      {selectedIssue && (
        <IssueDetailModal
          issueId={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}

      {/* Bulk Operations Bar */}
      {selectionMode && (
        <BulkOperationsBar
          projectId={projectId}
          selectedIssueIds={selectedIssueIds}
          onClearSelection={handleClearSelection}
          workflowStates={workflowStates}
        />
      )}
    </div>
  );
}
