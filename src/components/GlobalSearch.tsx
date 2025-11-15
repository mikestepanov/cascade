import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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

  // Search when query changes
  const issueResults = useQuery(
    api.issues.search,
    query.length >= 2 ? { query, limit: 10 } : "skip",
  );
  const documentResults = useQuery(
    api.documents.search,
    query.length >= 2 ? { query, limit: 10 } : "skip",
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

  // Reset query when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const allResults: SearchResult[] = [
    ...(issueResults?.map((r) => ({ ...r, type: "issue" as const })) ?? []),
    ...(documentResults?.map((r) => ({ ...r, type: "document" as const })) ?? []),
  ];

  const filteredResults =
    activeTab === "all" ? allResults : allResults.filter((r) => r.type === activeTab.slice(0, -1)); // Remove 's' from 'issues'/'documents'

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed top-4 sm:top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-auto sm:w-full max-w-2xl bg-white rounded-lg shadow-2xl z-50">
            {/* Search Input */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="relative">
                <svg
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
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search issues and documents..."
                  className="w-full pl-10 pr-4 py-3 text-lg border-none focus:outline-none"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 px-4 pt-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("all")}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("issues")}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "issues"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Issues
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "documents"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Documents
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
