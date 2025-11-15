import { useQuery } from "convex/react";
import { useState } from "react";
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

  const searchResults = useQuery(
    api.issues.search,
    searchQuery.length >= 2 ? { query: searchQuery, limit: 50 } : "skip",
  );

  const filteredResults = searchResults?.filter((issue) => {
    if (selectedType.length > 0 && !selectedType.includes(issue.type)) return false;
    if (selectedPriority.length > 0 && !selectedPriority.includes(issue.priority)) return false;
    if (selectedStatus.length > 0 && !selectedStatus.includes(issue.status)) return false;
    return true;
  });

  const handleSelectIssue = (issueId: Id<"issues">) => {
    onSelectIssue(issueId);
    onClose();
    setSearchQuery("");
    setSelectedType([]);
    setSelectedPriority([]);
    setSelectedStatus([]);
  };

  const toggleFilter = (value: string, array: string[], setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter((v) => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "highest":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      case "lowest":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "story":
        return "📖";
      case "epic":
        return "⚡";
      default:
        return "✓";
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
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
              Results {filteredResults && `(${filteredResults.length})`}
            </h3>
            {(selectedType.length > 0 ||
              selectedPriority.length > 0 ||
              selectedStatus.length > 0) && (
              <button
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

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <svg
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
            ) : !filteredResults || filteredResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>No issues found matching your criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredResults.map((issue) => (
                  <button
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
                            className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(issue.priority)}`}
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
