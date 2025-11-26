import { getPriorityColor, getTypeIcon } from "@/lib/issue-utils";
import { Flex } from "../ui/Flex";
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
      <div className="p-8 text-center text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
        <svg
          aria-hidden="true"
          className="w-16 h-16 mx-auto mb-4 text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
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
      <div className="p-8 text-center text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
        <p>No issues found matching your criteria</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-h-96 overflow-y-auto divide-y divide-ui-border-secondary dark:divide-ui-border-secondary-dark">
        {results.map((issue) => (
          <button
            type="button"
            key={issue._id}
            onClick={() => onSelectIssue(issue._id)}
            className="w-full p-4 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors text-left"
          >
            <Flex gap="md" align="start">
              <span className="text-xl flex-shrink-0">{getTypeIcon(issue.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                    {issue.key}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(issue.priority, "bg")}`}
                  >
                    {issue.priority}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  {issue.title}
                </h4>
              </div>
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="p-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
          >
            Load More ({total - results.length} remaining)
          </button>
        </div>
      )}
    </>
  );
}
