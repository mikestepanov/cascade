import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { handleKeyboardClick } from "@/lib/accessibility";
import { getTypeIcon, getPriorityColor } from "@/lib/issue-utils";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CustomFieldValues } from "./CustomFieldValues";
import { FileAttachments } from "./FileAttachments";
import { IssueComments } from "./IssueComments";
import { IssueDependencies } from "./IssueDependencies";
import { IssueWatchers } from "./IssueWatchers";
import { TimeTracker } from "./TimeTracker";
import { Skeleton } from "./ui/Skeleton";

interface IssueDetailModalProps {
  issueId: Id<"issues">;
  onClose: () => void;
}

export function IssueDetailModal({ issueId, onClose }: IssueDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const issue = useQuery(api.issues.get, { id: issueId });
  const updateIssue = useMutation(api.issues.update);

  if (!issue) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />

        {/* Modal Skeleton */}
        <div className="fixed inset-0 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full sm:max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto">
            {/* Header Skeleton */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-6 space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
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
      <div
        role="button"
        tabIndex={0}
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        onKeyDown={handleKeyboardClick(onClose)}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full sm:max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTypeIcon(issue.type)}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 font-mono">{issue.key}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(issue.priority, "badge")}`}>
                    {issue.priority}
                  </span>
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-2xl font-bold border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Issue title"
                />
              ) : (
                <div className="flex items-start justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">{issue.title}</h2>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32"
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-gray-600 whitespace-pre-wrap">
                  {issue.description || "No description provided"}
                </p>
              )}
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="font-medium">{issue.status}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Type:</span>
                <p className="font-medium capitalize">{issue.type}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Assignee:</span>
                <p className="font-medium">{issue.assignee?.name || "Unassigned"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Reporter:</span>
                <p className="font-medium">{issue.reporter?.name || "Unknown"}</p>
              </div>
            </div>

            {/* Labels */}
            {issue.labels.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {issue.labels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Time Tracking */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Time Tracking</h3>
              <TimeTracker
                issueId={issue._id}
                issueKey={issue.key}
                issueTitle={issue.title}
                estimatedHours={issue.estimatedHours}
                loggedHours={issue.loggedHours}
              />
            </div>

            {/* File Attachments */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Attachments</h3>
              <FileAttachments issueId={issue._id} />
            </div>

            {/* Issue Watchers */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Watchers</h3>
              <IssueWatchers issueId={issue._id} />
            </div>

            {/* Issue Dependencies */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Dependencies</h3>
              <IssueDependencies issueId={issue._id} projectId={issue.projectId} />
            </div>

            {/* Custom Fields */}
            <div>
              <CustomFieldValues issueId={issue._id} projectId={issue.projectId} />
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Comments</h3>
              <IssueComments issueId={issue._id} projectId={issue.projectId} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
