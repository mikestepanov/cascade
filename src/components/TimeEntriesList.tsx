import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface TimeEntriesListProps {
  issueId: Id<"issues">;
}

export function TimeEntriesList({ issueId }: TimeEntriesListProps) {
  const entries = useQuery(api.timeEntries.listByIssue, { issueId });
  const deleteEntry = useMutation(api.timeEntries.remove);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async (entryId: Id<"timeEntries">) => {
    if (!confirm("Are you sure you want to delete this time entry?")) {
      return;
    }

    try {
      await deleteEntry({ id: entryId });
      toast.success("Time entry deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete entry");
    }
  };

  if (!entries) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">⏱️</div>
        <p className="text-sm">No time logged yet</p>
      </div>
    );
  }

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Time Logged</p>
            <p className="text-2xl font-bold text-blue-600">{totalHours}h</p>
          </div>
          <div className="text-4xl">⏱️</div>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Entry Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-lg text-gray-900">{entry.hours}h</span>
                  <span className="text-sm text-gray-500">{formatDate(entry.date)}</span>
                  <span className="text-xs text-gray-400">by {entry.userName}</span>
                </div>

                {entry.description && (
                  <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                )}

                <p className="text-xs text-gray-400">
                  Logged on {formatDate(entry.createdAt)} at {formatTime(entry.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <button
                onClick={() => handleDelete(entry._id)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete entry"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
