import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { TimeTracker } from "./TimeTracker";
import { FileAttachments } from "./FileAttachments";
import { IssueWatchers } from "./IssueWatchers";
import { IssueDependencies } from "./IssueDependencies";
import { IssueComments } from "./IssueComments";
import { CustomFieldValues } from "./CustomFieldValues";

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateIssue({
        id: issueId,
        title: title || undefined,
        description: description || undefined,
      });
      toast.success("Issue updated");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update issue");
    }
  };

  const handleEdit = () => {
    setTitle(issue.title);
    setDescription(issue.description || "");
    setIsEditing(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "story":
        return "📖";
      case "epic":
        return "⚡";
      default:
        return "✓";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "highest":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-blue-600 bg-blue-50";
      case "lowest":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
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
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
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
