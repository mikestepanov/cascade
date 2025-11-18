import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import Fuse from "fuse.js";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
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
  }, [query]);

  const issueResults = issueSearchResult?.results ?? [];
  const documentResults = documentSearchResult?.results ?? [];
  const issueTotal = issueSearchResult?.total ?? 0;
  const documentTotal = documentSearchResult?.total ?? 0;
  const issueHasMore = issueSearchResult?.hasMore ?? false;
  const documentHasMore = documentSearchResult?.hasMore ?? false;

  // Apply fuzzy matching for better typo tolerance
  const fuzzyIssues = query.length >= 2 ? issueResults : [];
  const fuzzyDocuments = query.length >= 2 ? documentResults : [];

  const allResults: SearchResult[] = [
    ...(fuzzyIssues?.map((r: any) => ({ ...r, type: "issue" as const })) ?? []),
    ...(fuzzyDocuments?.map((r: any) => ({ ...r, type: "document" as const })) ?? []),
  ];

  const filteredResults =
    activeTab === "all"
      ? allResults
      : activeTab === "issues"
        ? fuzzyIssues?.map((r: any) => ({ ...r, type: "issue" as const })) ?? []
        : fuzzyDocuments?.map((r: any) => ({ ...r, type: "document" as const })) ?? [];

  const totalCount =
    activeTab === "all"
      ? issueTotal + documentTotal
      : activeTab === "issues"
        ? issueTotal
        : documentTotal;

  const hasMore =
    activeTab === "all"
      ? issueHasMore || documentHasMore
      : activeTab === "issues"
        ? issueHasMore
        : documentHasMore;

  const handleLoadMore = () => {
    if (activeTab === "all" || activeTab === "issues") {
      if (issueHasMore) {
        setIssueOffset(issueOffset + LIMIT);
      }
    }
    if (activeTab === "all" || activeTab === "documents") {
      if (documentHasMore) {
        setDocumentOffset(documentOffset + LIMIT);
      }
    }
  };

  return (
    <>
      {/* Search Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open search (⌘K)"
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
        <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <ModalBackdrop onClick={() => setIsOpen(false)} animated={false} />

          {/* Modal */}
          <div className="fixed top-4 sm:top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-auto sm:w-full max-w-2xl bg-white rounded-lg shadow-2xl z-50">
            {/* Search Input */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="relative">
                <svg
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                  className="pl-10 pr-4 py-3 text-lg border-none focus:outline-none"
                />
              </div>
            </div>

            {/* Tabs with counts */}
            <div className="flex gap-4 px-4 pt-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                All {query.length >= 2 && <span className="text-xs">({issueTotal + documentTotal})</span>}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("issues")}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "issues"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Issues {query.length >= 2 && <span className="text-xs">({issueTotal})</span>}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "documents"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Documents {query.length >= 2 && <span className="text-xs">({documentTotal})</span>}
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {query.length < 2 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No results found</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {filteredResults.map((result) => (
                      <a
                        key={result._id}
                        href={
                          result.type === "issue"
                            ? `/project/${result.projectId}?issue=${result._id}`
                            : `/document/${result._id}`
                        }
                        onClick={() => setIsOpen(false)}
                        className="block p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-100">
                            {result.type === "issue" ? (
                              <svg
                                aria-hidden="true"
                                className="w-5 h-5 text-blue-600"
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
                                className="w-5 h-5 text-green-600"
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
                            <div className="flex items-center gap-2">
                              {result.type === "issue" && (
                                <span className="text-xs font-mono text-gray-500">{result.key}</span>
                              )}
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {result.type}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {result.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="p-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Load More ({totalCount - filteredResults.length} remaining)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">↑↓</kbd> Navigate
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> Open
                </span>
              </div>
              <span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> Close
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
