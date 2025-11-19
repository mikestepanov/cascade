import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDateForInput, formatDuration } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";

interface ManualTimeEntryModalProps {
  onClose: () => void;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
}

export function ManualTimeEntryModal({
  onClose,
  projectId: initialProjectId,
  issueId: initialIssueId,
}: ManualTimeEntryModalProps) {
  const createTimeEntry = useMutation(api.timeTracking.createTimeEntry);
  const projects = useQuery(api.projects.list);
  const _currentUser = useQuery(api.auth.loggedInUser);

  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(initialProjectId);
  const [issueId, setIssueId] = useState<Id<"issues"> | undefined>(initialIssueId);
  const [date, setDate] = useState(() => formatDateForInput(Date.now()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [description, setDescription] = useState("");
  const [activity, setActivity] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [billable, setBillable] = useState(false);

  // Fetch issues for selected project
  const projectIssues = useQuery(api.issues.list, projectId ? { projectId } : "skip");

  // Calculate duration
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!date || !startTime || !endTime) {
      setDuration(0);
      return;
    }

    try {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);

      if (end <= start) {
        setDuration(0);
        return;
      }

      const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
      setDuration(durationSeconds);
    } catch {
      setDuration(0);
    }
  }, [date, startTime, endTime]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!date || !startTime || !endTime) {
      showError("Please fill in date, start time, and end time");
      return;
    }

    if (duration <= 0) {
      showError("End time must be after start time");
      return;
    }

    try {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);

      await createTimeEntry({
        projectId,
        issueId,
        startTime: start.getTime(),
        endTime: end.getTime(),
        description: description || undefined,
        activity: activity || undefined,
        tags,
        billable,
      });

      showSuccess("Time entry created");
      onClose();
    } catch (error) {
      showError(error, "Failed to create time entry");
    }
  };

  // Format duration for display (hours and minutes)
  const formatDurationDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Log Time Manually
        </h2>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={formatDateForInput(Date.now())}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          {duration > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Duration: {formatDurationDisplay(duration)}
              </span>
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project
            </label>
            <select
              value={projectId || ""}
              onChange={(e) => {
                setProjectId(e.target.value ? (e.target.value as Id<"projects">) : undefined);
                setIssueId(undefined); // Reset issue when project changes
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">No project</option>
              {projects?.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Selection */}
          {projectId && projectIssues && projectIssues.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Issue (optional)
              </label>
              <select
                value={issueId || ""}
                onChange={(e) =>
                  setIssueId(e.target.value ? (e.target.value as Id<"issues">) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">No issue</option>
                {projectIssues.map((issue) => (
                  <option key={issue._id} value={issue._id}>
                    {issue.key} - {issue.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 resize-none"
            />
          </div>

          {/* Activity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Select activity...</option>
              {ACTIVITY_TYPES.map((activityType) => (
                <option key={activityType} value={activityType}>
                  {activityType}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Billable */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Billable time
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Mark this time as billable to clients
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={duration <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Entry
          </button>
        </div>
      </div>
    </>
  );
}
