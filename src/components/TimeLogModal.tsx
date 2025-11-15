import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface TimeLogModalProps {
  issueId: Id<"issues">;
  issueName: string;
  onClose: () => void;
}

export function TimeLogModal({ issueId, issueName, onClose }: TimeLogModalProps) {
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logTime = useMutation(api.timeEntries.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hoursNum = parseFloat(hours);
    if (Number.isNaN(hoursNum) || hoursNum <= 0) {
      toast.error("Please enter valid hours");
      return;
    }

    setIsSubmitting(true);
    try {
      await logTime({
        issueId,
        hours: hoursNum,
        description: description.trim() || undefined,
        date: new Date(date).getTime(),
      });

      toast.success(`Logged ${hoursNum}h on ${issueName}`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log time");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-[calc(100%-2rem)] sm:w-full max-w-md">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Log Time</h2>
                <p className="text-sm text-gray-500 mt-1">{issueName}</p>
              </div>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Hours Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked *</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g., 2.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use decimals for partial hours (e.g., 1.5 for 1 hour 30 minutes)
              </p>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging..." : "Log Time"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
