import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDuration, formatHours } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";

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
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center gap-2">
          {/* Pulsing dot */}
          <div className="relative">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
          </div>

          {/* Timer display */}
          <span className="text-sm font-mono font-semibold text-blue-900 dark:text-blue-100">
            {formatDuration(currentDuration)}
          </span>

          {/* Description */}
          {runningTimer.description && (
            <span className="text-xs text-blue-700 dark:text-blue-300 max-w-[150px] truncate">
              {runningTimer.description}
            </span>
          )}
        </div>

        {/* Stop button */}
        <button
          type="button"
          onClick={handleStop}
          className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
          title="Stop timer"
        >
          Stop
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowStartModal(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Start timer"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
          />
        </svg>
        <span className="hidden sm:inline">Start Timer</span>
      </button>

      {showStartModal && <StartTimerModal onClose={() => setShowStartModal(false)} />}
    </>
  );
}

function StartTimerModal({ onClose }: { onClose: () => void }) {
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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true"></div>

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Start Timer</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              What are you working on? (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Fixing login bug..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity (optional)
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
            onClick={handleStart}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Start Timer
          </button>
        </div>
      </div>
    </>
  );
}
