import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { getPriorityColor, getTypeIcon } from "@/lib/issue-utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { InputField } from "./ui/InputField";
import { Modal } from "./ui/Modal";

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIssue: (issueId: Id<"issues">) => void;
}

export function AdvancedSearchModal({ isOpen, onClose, onSelectIssue }: AdvancedSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  // Reset offset when query or filters change
  useEffect(() => {
    setOffset(0);
  }, [searchQuery, selectedType, selectedPriority, selectedStatus]);

  // Use server-side filtering
  const searchResult = useQuery(
    api.issues.search,
    searchQuery.length >= 2
      ? {
          query: searchQuery,
          limit: LIMIT,
          offset,
          type: selectedType.length > 0 ? selectedType : undefined,
          priority: selectedPriority.length > 0 ? selectedPriority : undefined,
          status: selectedStatus.length > 0 ? selectedStatus : undefined,
        }
      : "skip",
  );

  const results = searchResult?.results ?? [];
  const total = searchResult?.total ?? 0;
  const hasMore = searchResult?.hasMore ?? false;

  const handleSelectIssue = (issueId: Id<"issues">) => {
    onSelectIssue(issueId);
    onClose();
    setSearchQuery("");
    setSelectedType([]);
    setSelectedPriority([]);
    setSelectedStatus([]);
    setOffset(0);
  };

  const handleLoadMore = () => {
    setOffset(offset + LIMIT);
  };

  const toggleFilter = (value: string, array: string[], setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter((v) => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Search" size="large">
      <div className="space-y-6">
        {/* Search Input */}
        <div>
          <InputField
            label="Search Issues"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, key, or description..."
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Type at least 2 characters to search
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </div>
            <div className="space-y-2">
              {["task", "bug", "story", "epic"].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedType.includes(type)}
                    onChange={() => toggleFilter(type, selectedType, setSelectedType)}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">
                    {getTypeIcon(type)} {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </div>
            <div className="space-y-2">
              {["highest", "high", "medium", "low", "lowest"].map((priority) => (
                <label key={priority} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPriority.includes(priority)}
                    onChange={() => toggleFilter(priority, selectedPriority, setSelectedPriority)}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {["todo", "in progress", "done", "blocked"].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatus.includes(status)}
                    onChange={() => toggleFilter(status, selectedStatus, setSelectedStatus)}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Results {searchQuery.length >= 2 && `(${total} total, showing ${results.length})`}
            </h3>
            {(selectedType.length > 0 ||
              selectedPriority.length > 0 ||
              selectedStatus.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedType([]);
                  setSelectedPriority([]);
                  setSelectedStatus([]);
                }}
                className="text-sm text-primary hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {searchQuery.length < 2 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <svg
                  aria-hidden="true"
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p>Start typing to search issues</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>No issues found matching your criteria</p>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((issue) => (
                    <button
                      type="button"
                      key={issue._id}
                      onClick={() => handleSelectIssue(issue._id)}
                      className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{getTypeIcon(issue.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                              {issue.key}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(issue.priority, "bg")}`}
                            >
                              {issue.priority}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {issue.title}
                          </h4>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      Load More ({total - results.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
