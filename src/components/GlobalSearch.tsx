import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Input } from "./ui/form/Input";
import { ModalBackdrop } from "./ui/ModalBackdrop";

type SearchResult =
  | {
      _id: Id<"issues">;
      title: string;
      key: string;
      projectId: Id<"projects">;
      description?: string;
      type: "issue";
    }
  | {
      _id: Id<"documents">;
      title: string;
      description?: string;
      type: "document";
    };

// Helper function to get filtered results based on active tab
function getFilteredResults(
  activeTab: "all" | "issues" | "documents",
  issueResults: Doc<"issues">[],
  documentResults: Doc<"documents">[],
): SearchResult[] {
  const issueSearchResults = issueResults.map((r) => ({ ...r, type: "issue" as const }));
  const documentSearchResults = documentResults.map((r) => ({ ...r, type: "document" as const }));

  if (activeTab === "all") {
    return [...issueSearchResults, ...documentSearchResults];
  }
  if (activeTab === "issues") {
    return issueSearchResults;
  }
  return documentSearchResults;
}

// Helper function to get total count based on active tab
function getTotalCount(
  activeTab: "all" | "issues" | "documents",
  issueTotal: number,
  documentTotal: number,
): number {
  if (activeTab === "all") {
    return issueTotal + documentTotal;
  }
  if (activeTab === "issues") {
    return issueTotal;
  }
  return documentTotal;
}

// Helper function to check if there are more results
function getHasMore(
  activeTab: "all" | "issues" | "documents",
  issueHasMore: boolean,
  documentHasMore: boolean,
): boolean {
  if (activeTab === "all") {
    return issueHasMore || documentHasMore;
  }
  if (activeTab === "issues") {
    return issueHasMore;
  }
  return documentHasMore;
}

// Tab button component
function SearchTab({
  label,
  isActive,
  count,
  showCount,
  onClick,
}: {
  label: string;
  isActive: boolean;
  count: number;
  showCount: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-2 px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        isActive
          ? "border-brand-500 text-brand-600 dark:text-brand-400"
          : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
      }`}
    >
      {label} {showCount && <span className="text-xs">({count})</span>}
    </button>
  );
}

// Search result item component
function SearchResultItem({ result, onClose }: { result: SearchResult; onClose: () => void }) {
  const href =
    result.type === "issue"
      ? `/project/${result.projectId}?issue=${result._id}`
      : `/document/${result._id}`;

  return (
    <a
      href={href}
      onClick={onClose}
      className="block p-3 sm:p-4 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark">
          {result.type === "issue" ? (
            <svg
              aria-hidden="true"
              className="w-5 h-5 text-brand-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="w-5 h-5 text-accent-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {result.type === "issue" && (
              <span className="text-xs font-mono text-ui-text-secondary dark:text-ui-text-secondary-dark">
                {result.key}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark rounded-full">
              {result.type}
            </span>
          </div>
          <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mt-1 truncate">
            {result.title}
          </p>
          <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1 line-clamp-2">
            {result.description || "No description"}
          </p>
        </div>
      </div>
    </a>
  );
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "issues" | "documents">("all");
  const [issueOffset, setIssueOffset] = useState(0);
  const [documentOffset, setDocumentOffset] = useState(0);
  const LIMIT = 20;

  // Search when query changes
  const issueSearchResult = useQuery(
    api.issues.search,
    query.length >= 2 ? { query, limit: LIMIT, offset: issueOffset } : "skip",
  );
  const documentSearchResult = useQuery(
    api.documents.search,
    query.length >= 2 ? { query, limit: LIMIT, offset: documentOffset } : "skip",
  );

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset query and offsets when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setIssueOffset(0);
      setDocumentOffset(0);
    }
  }, [isOpen]);

  // Reset offsets when query changes
  useEffect(() => {
    setIssueOffset(0);
    setDocumentOffset(0);
  }, []);

  const issueResults = issueSearchResult?.results ?? [];
  const documentResults = documentSearchResult?.results ?? [];
  const issueTotal = issueSearchResult?.total ?? 0;
  const documentTotal = documentSearchResult?.total ?? 0;
  const issueHasMore = issueSearchResult?.hasMore ?? false;
  const documentHasMore = documentSearchResult?.hasMore ?? false;

  // Get filtered results based on active tab
  const filteredResults =
    query.length >= 2 ? getFilteredResults(activeTab, issueResults, documentResults) : [];

  const totalCount = getTotalCount(activeTab, issueTotal, documentTotal);
  const hasMore = getHasMore(activeTab, issueHasMore, documentHasMore);

  const handleLoadMore = () => {
    const shouldLoadIssues = (activeTab === "all" || activeTab === "issues") && issueHasMore;
    const shouldLoadDocs = (activeTab === "all" || activeTab === "documents") && documentHasMore;

    if (shouldLoadIssues) {
      setIssueOffset(issueOffset + LIMIT);
    }
    if (shouldLoadDocs) {
      setDocumentOffset(documentOffset + LIMIT);
    }
  };

  return (
    <>
      {/* Search Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label="Open search (⌘K)"
        className="bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark"
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4"
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
        <span>Search...</span>
        <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-ui-text-secondary dark:text-ui-text-secondary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded">
          ⌘K
        </kbd>
      </Button>

      {/* Search Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <ModalBackdrop onClick={() => setIsOpen(false)} animated={false} />

          {/* Modal */}
          <div className="fixed top-4 sm:top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-auto sm:w-full max-w-2xl bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-2xl z-50">
            {/* Search Input */}
            <div className="p-3 sm:p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
              <div className="relative">
                <svg
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
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
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search issues and documents..."
                  className="pl-10 pr-4 py-2 sm:py-3 text-base sm:text-lg border-none focus:outline-none bg-transparent text-ui-text-primary dark:text-ui-text-primary-dark"
                />
              </div>
            </div>

            {/* Tabs with counts */}
            <div className="flex gap-2 sm:gap-4 px-4 pt-2 border-b border-ui-border-primary dark:border-ui-border-primary-dark overflow-x-auto">
              <SearchTab
                label="All"
                isActive={activeTab === "all"}
                count={issueTotal + documentTotal}
                showCount={query.length >= 2}
                onClick={() => setActiveTab("all")}
              />
              <SearchTab
                label="Issues"
                isActive={activeTab === "issues"}
                count={issueTotal}
                showCount={query.length >= 2}
                onClick={() => setActiveTab("issues")}
              />
              <SearchTab
                label="Documents"
                isActive={activeTab === "documents"}
                count={documentTotal}
                showCount={query.length >= 2}
                onClick={() => setActiveTab("documents")}
              />
            </div>

            {/* Results */}
            <div className="max-h-80 sm:max-h-96 overflow-y-auto">
              {query.length < 2 ? (
                <div className="p-8 text-center text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No results found</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-ui-border-primary dark:divide-ui-border-primary-dark">
                    {filteredResults.map((result) => (
                      <SearchResultItem
                        key={result._id}
                        result={result}
                        onClose={() => setIsOpen(false)}
                      />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="p-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        className="w-full text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50"
                      >
                        Load More ({totalCount - filteredResults.length} remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-ui-border-primary dark:border-ui-border-primary-dark flex items-center justify-between text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-2 py-1 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded">
                    ↑↓
                  </kbd>{" "}
                  Navigate
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded">
                    Enter
                  </kbd>{" "}
                  Open
                </span>
              </div>
              <span>
                <kbd className="px-2 py-1 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded">
                  Esc
                </kbd>{" "}
                Close
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
