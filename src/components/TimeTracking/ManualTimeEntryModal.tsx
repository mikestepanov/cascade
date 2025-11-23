import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDateForInput } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

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
    if (!(date && startTime && endTime)) {
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
    if (!(date && startTime && endTime)) {
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
    <Modal isOpen={true} onClose={onClose} title="Log Time Manually" maxWidth="2xl">
      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4">
          {/* Date */}
          <div>
            <label
              htmlFor="time-entry-date"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Date *
            </label>
            <input
              id="time-entry-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={formatDateForInput(Date.now())}
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="time-entry-start"
                className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
              >
                Start Time *
              </label>
              <input
                id="time-entry-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
                required
              />
            </div>
            <div>
              <label
                htmlFor="time-entry-end"
                className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
              >
                End Time *
              </label>
              <input
                id="time-entry-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          {duration > 0 && (
            <div className="p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
              <span className="text-sm font-medium text-brand-900 dark:text-brand-100">
                Duration: {formatDurationDisplay(duration)}
              </span>
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label
              htmlFor="time-entry-project"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Project
            </label>
            <select
              id="time-entry-project"
              value={projectId || ""}
              onChange={(e) => {
                setProjectId(e.target.value ? (e.target.value as Id<"projects">) : undefined);
                setIssueId(undefined); // Reset issue when project changes
              }}
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
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
              <label
                htmlFor="time-entry-issue"
                className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
              >
                Issue (optional)
              </label>
              <select
                id="time-entry-issue"
                value={issueId || ""}
                onChange={(e) =>
                  setIssueId(e.target.value ? (e.target.value as Id<"issues">) : undefined)
                }
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
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
            <label
              htmlFor="time-entry-description"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Description
            </label>
            <textarea
              id="time-entry-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark resize-none"
            />
          </div>

          {/* Activity */}
          <div>
            <label
              htmlFor="time-entry-activity"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Activity
            </label>
            <select
              id="time-entry-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
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
            <label
              htmlFor="time-entry-tags"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Tags
            </label>
            <div className="flex gap-2">
              <input
                id="time-entry-tags"
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
                className="flex-1 px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
              />
              <Button onClick={handleAddTag} variant="secondary" size="sm">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs rounded"
                  >
                    {tag}
                    <Button
                      onClick={() => handleRemoveTag(tag)}
                      variant="ghost"
                      size="sm"
                      className="p-0 min-w-0 h-auto hover:text-brand-900 dark:hover:text-brand-100"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </Button>
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
                className="w-4 h-4 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                Billable time
              </span>
            </label>
            <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1 ml-6">
              Mark this time as billable to clients
            </p>
          </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={duration <= 0}>
            Create Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
}
