import { getPriorityColor, getTypeIcon } from "@/lib/issue-utils";
import type { Id } from "../../../convex/_generated/dataModel";

interface SearchResult {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: string;
  priority: string;
}

interface SearchResultsListProps {
  searchQuery: string;
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  onSelectIssue: (issueId: Id<"issues">) => void;
  onLoadMore: () => void;
}

export function SearchResultsList({
  searchQuery,
  results,
  total,
  hasMore,
  onSelectIssue,
  onLoadMore,
}: SearchResultsListProps) {
  if (searchQuery.length < 2) {
    return (
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
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>No issues found matching your criteria</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {results.map((issue) => (
          <button
            type="button"
            key={issue._id}
            onClick={() => onSelectIssue(issue._id)}
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

      {hasMore && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            Load More ({total - results.length} remaining)
          </button>
        </div>
      )}
    </>
  );
}
