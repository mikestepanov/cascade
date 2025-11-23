import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { getPriorityColor, getTypeIcon } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CustomFieldValues } from "./CustomFieldValues";
import { FileAttachments } from "./FileAttachments";
import { IssueComments } from "./IssueComments";
import { IssueDependencies } from "./IssueDependencies";
import { IssueMetadataSection } from "./IssueDetail/IssueMetadataSection";
import { SubtasksList } from "./IssueDetail/SubtasksList";
import { IssueWatchers } from "./IssueWatchers";
import { TimeTracker } from "./TimeTracker";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { XIcon } from "./ui/icons";
import { ModalBackdrop } from "./ui/ModalBackdrop";

interface IssueDetailModalProps {
  issueId: Id<"issues">;
  onClose: () => void;
}

export function IssueDetailModal({ issueId, onClose }: IssueDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const issue = useQuery(api.issues.get, { id: issueId });
  const subtasks = useQuery(api.issues.listSubtasks, { parentId: issueId });
  const updateIssue = useMutation(api.issues.update);

  if (!issue) {
    return (
      <>
        {/* Backdrop */}
        <ModalBackdrop onClick={onClose} animated={false} />

        {/* Modal Skeleton */}
        <div className="fixed inset-0 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
          {/* biome-ignore lint/a11y/useSemanticElements: role="status" is correct for loading state */}
          <div
            role="status"
            aria-busy="true"
            className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-none sm:rounded-lg shadow-xl w-full sm:max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto"
          >
            <span className="sr-only">Loading...</span>
            {/* Header Skeleton */}
            <div className="sticky top-0 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark h-8 w-8 rounded" />
                <div className="space-y-2">
                  <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-4 w-24" />
                  <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-4 w-16" />
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-4 sm:p-6 space-y-6">
              <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-8 w-3/4" />
              <div className="space-y-2">
                <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-4 w-full" />
                <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-4 w-full" />
                <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-4 w-2/3" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
                <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-12 w-full" />
                <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-12 w-full" />
                <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-12 w-full" />
                <div className="animate-pulse bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const handleSave = async () => {
    try {
      await updateIssue({
        id: issueId,
        title: title || undefined,
        description: description || undefined,
      });
      showSuccess("Issue updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update issue");
    }
  };

  const handleEdit = () => {
    setTitle(issue.title);
    setDescription(issue.description || "");
    setIsEditing(true);
  };

  return (
    <>
      {/* Backdrop */}
      <ModalBackdrop onClick={onClose} animated={false} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
        <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-none sm:rounded-lg shadow-xl w-full sm:max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTypeIcon(issue.type)}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-ui-text-secondary font-mono">{issue.key}</span>
                  <Badge size="md" className={getPriorityColor(issue.priority, "badge")}>
                    {issue.priority}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close issue modal"
              className="p-1 min-h-0"
            >
              <XIcon />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Title */}
            <div>
              {isEditing ? (
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold"
                  placeholder="Issue title"
                />
              ) : (
                <div className="flex items-start justify-between">
                  <h2 className="text-2xl font-bold text-ui-text-primary">{issue.title}</h2>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="text-sm text-brand-600 hover:text-brand-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              {isEditing ? (
                <Textarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Add a description..."
                />
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-ui-text-primary mb-2">Description</h3>
                  <p className="text-ui-text-secondary whitespace-pre-wrap">
                    {issue.description || "No description provided"}
                  </p>
                </div>
              )}
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex space-x-2">
                <Button onClick={handleSave} variant="primary">
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            )}

            {/* Metadata */}
            <IssueMetadataSection
              status={issue.status}
              type={issue.type}
              assignee={issue.assignee}
              reporter={issue.reporter}
              storyPoints={issue.storyPoints}
              labels={issue.labels}
            />

            {/* Time Tracking */}
            <div>
              <h3 className="text-sm font-medium text-ui-text-primary mb-3">Time Tracking</h3>
              <TimeTracker issueId={issue._id} estimatedHours={issue.estimatedHours}
              />
            </div>

            {/* File Attachments */}
            <div>
              <h3 className="text-sm font-medium text-ui-text-primary mb-3">Attachments</h3>
              <FileAttachments issueId={issue._id} />
            </div>

            {/* Issue Watchers */}
            <div>
              <h3 className="text-sm font-medium text-ui-text-primary mb-3">Watchers</h3>
              <IssueWatchers issueId={issue._id} />
            </div>

            {/* Issue Dependencies */}
            <div>
              <h3 className="text-sm font-medium text-ui-text-primary mb-3">Dependencies</h3>
              <IssueDependencies issueId={issue._id} projectId={issue.projectId} />
            </div>

            {/* Sub-tasks (only show for non-subtasks) */}
            {issue.type !== "subtask" && (
              <SubtasksList issueId={issue._id} projectId={issue.projectId} subtasks={subtasks} />
            )}

            {/* Custom Fields */}
            <div>
              <CustomFieldValues issueId={issue._id} projectId={issue.projectId} />
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium text-ui-text-primary mb-3">Comments</h3>
              <IssueComments issueId={issue._id} projectId={issue.projectId} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
