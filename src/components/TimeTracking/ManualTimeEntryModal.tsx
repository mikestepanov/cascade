import { useMutation, useQuery } from "convex/react";
import { Clock, Hourglass } from "lucide-react";
import { useEffect, useState } from "react";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDateForInput, formatDurationHuman, parseDuration } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Textarea } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/ShadcnSelect";

type EntryMode = "duration" | "timeRange";

interface ManualTimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
}

interface TimeEntryData {
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
  startTime: number;
  endTime: number;
  description: string | undefined;
  activity: string | undefined;
  tags: string[];
  billable: boolean;
}

/**
 * Calculate time entry data for duration mode
 */
function calculateDurationModeEntry(
  date: string,
  effectiveDuration: number,
  projectId: Id<"projects"> | undefined,
  issueId: Id<"issues"> | undefined,
  description: string,
  activity: string,
  tags: string[],
  billable: boolean,
): TimeEntryData {
  const dateObj = new Date(date);
  const now = new Date();
  // Use current time if date is today, otherwise use end of day
  const endDate =
    dateObj.toDateString() === now.toDateString() ? now : new Date(dateObj.setHours(17, 0, 0, 0));
  const endTime = endDate.getTime();
  const startTimeMs = endTime - effectiveDuration * 1000;

  return {
    projectId,
    issueId,
    startTime: startTimeMs,
    endTime: endTime,
    description: description || undefined,
    activity: activity || undefined,
    tags,
    billable,
  };
}

/**
 * Add a tag to the list if it doesn't already exist
 */
function addTagToList(tags: string[], newTag: string): string[] {
  const tag = newTag.trim();
  if (tag && !tags.includes(tag)) {
    return [...tags, tag];
  }
  return tags;
}

/**
 * Parse duration input and return seconds (0 if invalid)
 */
function parseDurationToSeconds(input: string): number {
  const parsed = parseDuration(input);
  return parsed ?? 0;
}

/**
 * Calculate duration in seconds from time range
 */
function calculateTimeRangeDuration(date: string, startTime: string, endTime: string): number {
  if (!(date && startTime && endTime)) return 0;
  try {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (end <= start) return 0;
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  } catch {
    return 0;
  }
}

/**
 * Validate time entry form input
 * Returns error message if invalid, null if valid
 */
function validateTimeEntry(
  date: string,
  entryMode: EntryMode,
  effectiveDuration: number,
  startTime: string,
  endTime: string,
  duration: number,
): string | null {
  if (!date) return "Please select a date";
  if (entryMode === "duration" && effectiveDuration <= 0) return "Please enter a valid duration";
  if (entryMode === "timeRange" && !(startTime && endTime))
    return "Please fill in start time and end time";
  if (entryMode === "timeRange" && duration <= 0) return "End time must be after start time";
  return null;
}

/**
 * Calculate time entry data for time range mode
 */
function calculateTimeRangeModeEntry(
  date: string,
  startTime: string,
  endTime: string,
  projectId: Id<"projects"> | undefined,
  issueId: Id<"issues"> | undefined,
  description: string,
  activity: string,
  tags: string[],
  billable: boolean,
): TimeEntryData {
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);

  return {
    projectId,
    issueId,
    startTime: start.getTime(),
    endTime: end.getTime(),
    description: description || undefined,
    activity: activity || undefined,
    tags,
    billable,
  };
}

// Mode toggle button component
function ModeToggleButton({
  mode,
  currentMode,
  icon: Icon,
  label,
  onClick,
}: {
  mode: EntryMode;
  currentMode: EntryMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  const isActive = currentMode === mode;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? "bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark shadow-sm"
          : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export function ManualTimeEntryModal({
  open,
  onOpenChange,
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
      setDurationSeconds(parseDurationToSeconds(durationInput));
    }
  }, [durationInput, entryMode]);

  // Calculate duration from time range
  useEffect(() => {
    if (entryMode !== "timeRange") return;
    setDuration(calculateTimeRangeDuration(date, startTime, endTime));
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
    const newTags = addTagToList(tags, tagInput);
    if (newTags !== tags) {
      setTags(newTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    // Validate form input
    const validationError = validateTimeEntry(
      date,
      entryMode,
      effectiveDuration,
      startTime,
      endTime,
      duration,
    );
    if (validationError) {
      showError(validationError);
      return;
    }

    // Calculate entry data based on mode
    const entryData =
      entryMode === "duration"
        ? calculateDurationModeEntry(
            date,
            effectiveDuration,
            projectId,
            issueId,
            description,
            activity,
            tags,
            billable,
          )
        : calculateTimeRangeModeEntry(
            date,
            startTime,
            endTime,
            projectId,
            issueId,
            description,
            activity,
            tags,
            billable,
          );

    try {
      await createTimeEntry(entryData);
      showSuccess("Time entry created");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to create time entry");
    }
  };

  // Check if duration input is valid (for showing error state)
  const isDurationInputValid = durationInput.trim() === "" || durationSeconds > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Time Manually</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
            <ModeToggleButton
              mode="duration"
              currentMode={entryMode}
              icon={Hourglass}
              label="Duration"
              onClick={() => setEntryMode("duration")}
            />
            <ModeToggleButton
              mode="timeRange"
              currentMode={entryMode}
              icon={Clock}
              label="Start/End Time"
              onClick={() => setEntryMode("timeRange")}
            />
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark ${
                  isDurationInputValid
                    ? "border-ui-border-primary dark:border-ui-border-primary-dark"
                    : "border-red-500 dark:border-red-500"
                }`}
              />
              {!isDurationInputValid ? (
                <p className="text-xs text-red-500 mt-1">
                  Invalid format. Try: 1:30, 1.5, 1h 30m, or 90m
                </p>
              ) : (
                <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
                  Accepts: 1:30, 1.5, 1h 30m, 90m
                </p>
              )}

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
                    Duration: {formatDurationHuman(duration)}
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
            <Select
              value={projectId || "none"}
              onValueChange={(value) => {
                setProjectId(value === "none" ? undefined : (value as Id<"projects">));
                setIssueId(undefined); // Reset issue when project changes
              }}
            >
              <SelectTrigger id="time-entry-project" className="w-full">
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Select
                value={issueId || "none"}
                onValueChange={(value) =>
                  setIssueId(value === "none" ? undefined : (value as Id<"issues">))
                }
              >
                <SelectTrigger id="time-entry-issue" className="w-full">
                  <SelectValue placeholder="Select issue..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No issue</SelectItem>
                  {projectIssues.map((issue) => (
                    <SelectItem key={issue._id} value={issue._id}>
                      {issue.key} - {issue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            rows={3}
          />

          {/* Activity */}
          <div>
            <label
              htmlFor="time-entry-activity"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Activity
            </label>
            <Select
              value={activity || "none"}
              onValueChange={(value) => setActivity(value === "none" ? "" : value)}
            >
              <SelectTrigger id="time-entry-activity" className="w-full">
                <SelectValue placeholder="Select activity..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select activity...</SelectItem>
                {ACTIVITY_TYPES.map((activityType) => (
                  <SelectItem key={activityType} value={activityType}>
                    {activityType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={effectiveDuration <= 0}>
              Create Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
