import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDateForInput, formatDurationHuman, parseDuration } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Modal } from "../ui/Modal";

type EntryMode = "duration" | "timeRange";

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

  // Entry mode toggle
  const [entryMode, setEntryMode] = useState<EntryMode>("duration");
  const [durationInput, setDurationInput] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Fetch issues for selected project
  const projectIssues = useQuery(api.issues.list, projectId ? { projectId } : "skip");

  // Calculate duration from time range
  const [duration, setDuration] = useState(0);

  // Parse duration input when it changes
  useEffect(() => {
    if (entryMode === "duration") {
      const parsed = parseDuration(durationInput);
      setDurationSeconds(parsed ?? 0);
    }
  }, [durationInput, entryMode]);

  // Calculate duration from time range
  useEffect(() => {
    if (entryMode !== "timeRange") return;
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

      const durationSecs = Math.floor((end.getTime() - start.getTime()) / 1000);
      setDuration(durationSecs);
    } catch {
      setDuration(0);
    }
  }, [date, startTime, endTime, entryMode]);

  // Quick increment handler for duration mode
  const handleQuickIncrement = (minutes: number) => {
    const newSeconds = durationSeconds + minutes * 60;
    setDurationSeconds(newSeconds);
    setDurationInput(formatDurationHuman(newSeconds));
  };

  // Get effective duration based on mode
  const effectiveDuration = entryMode === "duration" ? durationSeconds : duration;

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
    if (!date) {
      showError("Please select a date");
      return;
    }

    if (entryMode === "duration") {
      if (effectiveDuration <= 0) {
        showError("Please enter a valid duration");
        return;
      }

      try {
        // For duration mode, create entry ending "now" (or end of selected date)
        const dateObj = new Date(date);
        const now = new Date();
        // Use current time if date is today, otherwise use end of day
        const endDate =
          dateObj.toDateString() === now.toDateString()
            ? now
            : new Date(dateObj.setHours(17, 0, 0, 0));
        const endTime = endDate.getTime();
        const startTimeMs = endTime - effectiveDuration * 1000;

        await createTimeEntry({
          projectId,
          issueId,
          startTime: startTimeMs,
          endTime: endTime,
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
    } else {
      // Time range mode
      if (!(startTime && endTime)) {
        showError("Please fill in start time and end time");
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-4"
      >
        {/* Mode Toggle */}
        <div className="flex gap-1 p-1 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
          <button
            type="button"
            onClick={() => setEntryMode("duration")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              entryMode === "duration"
                ? "bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark shadow-sm"
                : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
          >
            Duration
          </button>
          <button
            type="button"
            onClick={() => setEntryMode("timeRange")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              entryMode === "timeRange"
                ? "bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark shadow-sm"
                : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
          >
            Start/End Time
          </button>
        </div>

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

        {/* Duration Mode */}
        {entryMode === "duration" && (
          <div>
            <label
              htmlFor="time-entry-duration"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Duration *
            </label>
            <input
              id="time-entry-duration"
              type="text"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              placeholder="e.g., 1:30, 1.5, 1h 30m, 90m"
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
            />
            <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
              Accepts: 1:30, 1.5, 1h 30m, 90m
            </p>

            {/* Quick Increment Buttons */}
            <Flex gap="sm" className="mt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickIncrement(15)}
              >
                +15m
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickIncrement(30)}
              >
                +30m
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickIncrement(60)}
              >
                +1h
              </Button>
              {durationSeconds > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDurationSeconds(0);
                    setDurationInput("");
                  }}
                >
                  Clear
                </Button>
              )}
            </Flex>

            {/* Duration Display */}
            {durationSeconds > 0 && (
              <div className="mt-3 p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
                <span className="text-sm font-medium text-brand-900 dark:text-brand-100">
                  Duration: {formatDurationHuman(durationSeconds)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Time Range Mode */}
        {entryMode === "timeRange" && (
          <>
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
          </>
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
          <Flex gap="sm">
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
          </Flex>
          {tags.length > 0 && (
            <div className="mt-2">
              <Flex gap="sm" className="flex-wrap">
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
              </Flex>
            </div>
          )}
        </div>

        {/* Billable */}
        <div>
          <label className="cursor-pointer">
            <Flex align="center" gap="sm">
              <input
                type="checkbox"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                Billable time
              </span>
            </Flex>
          </label>
          <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1 ml-6">
            Mark this time as billable to clients
          </p>
        </div>

        <Flex justify="end" gap="sm" className="pt-4">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={duration <= 0}>
            Create Entry
          </Button>
        </Flex>
      </form>
    </Modal>
  );
}
