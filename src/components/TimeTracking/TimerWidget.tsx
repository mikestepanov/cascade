import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDuration, formatHours } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Modal } from "../ui/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/ShadcnSelect";

export function TimerWidget() {
  const runningTimer = useQuery(api.timeTracking.getRunningTimer);
  const _startTimer = useMutation(api.timeTracking.startTimer);
  const stopTimer = useMutation(api.timeTracking.stopTimer);

  const [currentDuration, setCurrentDuration] = useState(0);
  const [showStartModal, setShowStartModal] = useState(false);

  // Update duration every second if timer is running
  useEffect(() => {
    if (!runningTimer) {
      setCurrentDuration(0);
      return;
    }

    // Calculate initial duration
    const elapsed = Math.floor((Date.now() - runningTimer.startTime) / 1000);
    setCurrentDuration(elapsed);

    // Update every second
    const interval = setInterval(() => {
      const newElapsed = Math.floor((Date.now() - runningTimer.startTime) / 1000);
      setCurrentDuration(newElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTimer]);

  const handleStop = async () => {
    if (!runningTimer) return;

    try {
      const result = await stopTimer({ entryId: runningTimer._id });
      const hours = formatHours(result.duration);
      showSuccess(`Timer stopped: ${hours}h logged`);
    } catch (error) {
      showError(error, "Failed to stop timer");
    }
  };

  if (runningTimer) {
    return (
      <Flex
        align="center"
        gap="sm"
        className="px-3 py-2 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg"
      >
        <Flex align="center" gap="sm">
          {/* Pulsing dot */}
          <div className="relative">
            <div className="w-2 h-2 bg-brand-600 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-brand-600 rounded-full animate-ping" />
          </div>

          {/* Timer display */}
          <span className="text-sm font-mono font-semibold text-brand-900 dark:text-brand-100">
            {formatDuration(currentDuration)}
          </span>

          {/* Description */}
          {runningTimer.description && (
            <span className="text-xs text-brand-700 dark:text-brand-300 max-w-[150px] truncate">
              {runningTimer.description}
            </span>
          )}
        </Flex>

        {/* Stop button */}
        <Button
          onClick={handleStop}
          variant="ghost"
          size="sm"
          className="text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-800"
          aria-label="Stop timer"
        >
          Stop
        </Button>
      </Flex>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowStartModal(true)}
        variant="secondary"
        size="sm"
        leftIcon={
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        }
        aria-label="Start timer"
      >
        <span className="hidden sm:inline">Start Timer</span>
      </Button>

      {showStartModal && (
        <StartTimerModal isOpen={showStartModal} onClose={() => setShowStartModal(false)} />
      )}
    </>
  );
}

function StartTimerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const startTimer = useMutation(api.timeTracking.startTimer);
  const [description, setDescription] = useState("");
  const [activity, setActivity] = useState("");

  const handleStart = async () => {
    try {
      await startTimer({
        description: description || undefined,
        activity: activity || undefined,
      });
      showSuccess("Timer started");
      onClose();
    } catch (error) {
      showError(error, "Failed to start timer");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start Timer" maxWidth="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleStart();
        }}
      >
        <Flex direction="column" gap="lg">
          <div>
            <label
              htmlFor="timer-description"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              What are you working on? (optional)
            </label>
            <input
              id="timer-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Fixing login bug..."
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
            />
          </div>

          <div>
            <label
              htmlFor="timer-activity"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Activity (optional)
            </label>
            <Select value={activity} onValueChange={(value) => setActivity(value)}>
              <SelectTrigger className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark">
                <SelectValue placeholder="Select activity..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select activity...</SelectItem>
                {ACTIVITY_TYPES.map((activityType) => (
                  <SelectItem key={activityType} value={activityType}>
                    {activityType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Flex justify="end" gap="sm" className="pt-4">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Start Timer
            </Button>
          </Flex>
        </Flex>
      </form>
    </Modal>
  );
}
