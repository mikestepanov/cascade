import { useMutation, useQuery } from "convex/react";
import { Clock, Hourglass, Play } from "lucide-react";
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

type EntryMode = "timer" | "duration" | "timeRange";

interface TimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected project */
  projectId?: Id<"projects">;
  /** Pre-selected issue */
  issueId?: Id<"issues">;
  /** Default mode when opening */
  defaultMode?: "timer" | "log";
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

/**
 * Unified Time Entry Modal
 *
 * Combines timer start and manual time logging into one reusable component.
 * Supports pre-filling project/issue via props for context-aware usage.
 */
export function TimeEntryModal({
  open,
  onOpenChange,
  projectId: initialProjectId,
  issueId: initialIssueId,
  defaultMode = "log",
}: TimeEntryModalProps) {
  const createTimeEntry = useMutation(api.timeTracking.createTimeEntry);
  const startTimer = useMutation(api.timeTracking.startTimer);
  const projects = useQuery(api.projects.list);

  // Form state
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(initialProjectId);
  const [issueId, setIssueId] = useState<Id<"issues"> | undefined>(initialIssueId);
  const [description, setDescription] = useState("");
  const [activity, setActivity] = useState("");
  const [billable, setBillable] = useState(false);

  // Log mode state
  const [date, setDate] = useState(() => formatDateForInput(Date.now()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Entry mode: timer, duration, or timeRange
  const [entryMode, setEntryMode] = useState<EntryMode>(
    defaultMode === "timer" ? "timer" : "duration",
  );
  const [durationInput, setDurationInput] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Fetch issues for selected project
  const projectIssues = useQuery(api.issues.listByProject, projectId ? { projectId } : "skip");

  // Calculate duration from time range
  const [timeRangeDuration, setTimeRangeDuration] = useState(0);

  // Reset form when modal opens with new props
  useEffect(() => {
    if (open) {
      setProjectId(initialProjectId);
      setIssueId(initialIssueId);
      setEntryMode(defaultMode === "timer" ? "timer" : "duration");
      // Reset other fields
      setDescription("");
      setActivity("");
      setBillable(false);
      setDate(formatDateForInput(Date.now()));
      setStartTime("09:00");
      setEndTime("17:00");
      setTags([]);
      setTagInput("");
      setDurationInput("");
      setDurationSeconds(0);
    }
  }, [open, initialProjectId, initialIssueId, defaultMode]);

  // Parse duration input when it changes
  useEffect(() => {
    if (entryMode === "duration") {
      setDurationSeconds(parseDurationToSeconds(durationInput));
    }
  }, [durationInput, entryMode]);

  // Calculate duration from time range
  useEffect(() => {
    if (entryMode === "timeRange") {
      setTimeRangeDuration(calculateTimeRangeDuration(date, startTime, endTime));
    }
  }, [date, startTime, endTime, entryMode]);

  // Quick increment handler for duration mode
  const handleQuickIncrement = (minutes: number) => {
    const newSeconds = durationSeconds + minutes * 60;
    setDurationSeconds(newSeconds);
    setDurationInput(formatDurationHuman(newSeconds));
  };

  // Get effective duration based on mode
  const effectiveDuration = entryMode === "duration" ? durationSeconds : timeRangeDuration;

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

  // Handle starting a timer
  const handleStartTimer = async () => {
    try {
      await startTimer({
        projectId,
        issueId,
        description: description || undefined,
        activity: activity || undefined,
        billable,
      });
      showSuccess("Timer started");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to start timer");
    }
  };

  // Handle logging past time
  const handleLogTime = async () => {
    // Validate
    if (!date) {
      showError("Please select a date");
      return;
    }
    if (entryMode === "duration" && effectiveDuration <= 0) {
      showError("Please enter a valid duration");
      return;
    }
    if (entryMode === "timeRange" && !(startTime && endTime)) {
      showError("Please fill in start time and end time");
      return;
    }
    if (entryMode === "timeRange" && timeRangeDuration <= 0) {
      showError("End time must be after start time");
      return;
    }

    // Calculate times based on mode
    let entryStartTime: number;
    let entryEndTime: number;

    if (entryMode === "duration") {
      const dateObj = new Date(date);
      const now = new Date();
      const endDate =
        dateObj.toDateString() === now.toDateString()
          ? now
          : new Date(dateObj.setHours(17, 0, 0, 0));
      entryEndTime = endDate.getTime();
      entryStartTime = entryEndTime - effectiveDuration * 1000;
    } else {
      entryStartTime = new Date(`${date}T${startTime}`).getTime();
      entryEndTime = new Date(`${date}T${endTime}`).getTime();
    }

    try {
      await createTimeEntry({
        projectId,
        issueId,
        startTime: entryStartTime,
        endTime: entryEndTime,
        description: description || undefined,
        activity: activity || undefined,
        tags,
        billable,
      });
      showSuccess("Time entry created");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to create time entry");
    }
  };

  const handleSubmit = () => {
    if (entryMode === "timer") {
      void handleStartTimer();
    } else {
      void handleLogTime();
    }
  };

  // Check if duration input is valid
  const isDurationInputValid = durationInput.trim() === "" || durationSeconds > 0;

  const isTimerMode = entryMode === "timer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isTimerMode ? "Start Timer" : "Log Time"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
            <ModeToggleButton
              mode="timer"
              currentMode={entryMode}
              icon={Play}
              label="Start Timer"
              onClick={() => setEntryMode("timer")}
            />
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
              label="Time Range"
              onClick={() => setEntryMode("timeRange")}
            />
          </div>

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
                Issue
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
            placeholder="What are you working on?"
            rows={2}
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
          </div>

          {/* Duration Mode Fields */}
          {entryMode === "duration" && (
            <>
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

              {/* Duration Input */}
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
                      : "border-status-error dark:border-status-error"
                  }`}
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
                  <Button type="button" onClick={handleAddTag} variant="secondary" size="sm">
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
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-brand-900 dark:hover:text-brand-100"
                            aria-label={`Remove tag ${tag}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </Flex>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Time Range Mode Fields */}
          {entryMode === "timeRange" && (
            <>
              {/* Date */}
              <div>
                <label
                  htmlFor="time-entry-date-range"
                  className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
                >
                  Date *
                </label>
                <input
                  id="time-entry-date-range"
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
              {timeRangeDuration > 0 && (
                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
                  <span className="text-sm font-medium text-brand-900 dark:text-brand-100">
                    Duration: {formatDurationHuman(timeRangeDuration)}
                  </span>
                </div>
              )}

              {/* Tags */}
              <div>
                <label
                  htmlFor="time-entry-tags-range"
                  className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
                >
                  Tags
                </label>
                <Flex gap="sm">
                  <input
                    id="time-entry-tags-range"
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
                  <Button type="button" onClick={handleAddTag} variant="secondary" size="sm">
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
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-brand-900 dark:hover:text-brand-100"
                            aria-label={`Remove tag ${tag}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </Flex>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isTimerMode && effectiveDuration <= 0}
              leftIcon={isTimerMode ? <Play className="w-4 h-4" /> : undefined}
            >
              {isTimerMode ? "Start Timer" : "Log Time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
