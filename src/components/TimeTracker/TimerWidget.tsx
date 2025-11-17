import { useMutation, useQuery } from "convex/react";
import { Clock, DollarSign, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface TimerWidgetProps {
  issueId?: Id<"issues">;
  issueKey?: string;
  issueTitle?: string;
}

export function TimerWidget({ issueId, issueKey, issueTitle }: TimerWidgetProps) {
  const activeTimer = useQuery(api.timeEntries.getActiveTimer);
  const startTimer = useMutation(api.timeEntries.startTimer);
  const stopTimer = useMutation(api.timeEntries.stopTimer);

  const [elapsed, setElapsed] = useState(0);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [billable, setBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState<number | undefined>();

  // Update elapsed time every second
  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      return;
    }

    setElapsed(activeTimer.elapsed);

    const interval = setInterval(() => {
      setElapsed(Date.now() - activeTimer.startedAt);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatElapsed = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!issueId) {
      toast.error("No issue selected");
      return;
    }

    try {
      await startTimer({ issueId });
      toast.success("Timer started");
    } catch (error) {
      toast.error("Failed to start timer");
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer({ billable, hourlyRate });
      toast.success("Time logged successfully");
      setShowStopDialog(false);
      setBillable(true);
      setHourlyRate(undefined);
    } catch (error) {
      toast.error("Failed to stop timer");
    }
  };

  // If no timer is running and we're on an issue page, show start button
  if (!activeTimer && issueId) {
    return (
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={handleStart}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Play className="w-5 h-5" />
          <span className="font-medium">Start Timer</span>
        </button>
      </div>
    );
  }

  // If timer is running, show timer widget
  if (activeTimer) {
    return (
      <>
        <div className="fixed bottom-6 left-6 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[300px]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Timer Running</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="mb-3">
            <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
              {formatElapsed(elapsed)}
            </div>
          </div>

          <div className="mb-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {activeTimer.issueKey}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {activeTimer.issueTitle}
            </div>
          </div>

          <button
            onClick={() => setShowStopDialog(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Square className="w-4 h-4" />
            <span className="font-medium">Stop Timer</span>
          </button>
        </div>

        {/* Stop Dialog */}
        {showStopDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Stop Timer & Log Time
              </h3>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time Tracked</div>
                <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {formatElapsed(elapsed)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(elapsed / (1000 * 60 * 60)).toFixed(2)} hours
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billable}
                    onChange={(e) => setBillable(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Billable to client
                  </span>
                </label>
              </div>

              {billable && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hourly Rate (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={hourlyRate ?? ""}
                      onChange={(e) =>
                        setHourlyRate(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      placeholder="Use project default"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave blank to use project default rate
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStopDialog(false);
                    setBillable(true);
                    setHourlyRate(undefined);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Log Time
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
