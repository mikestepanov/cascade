import { useEffect, useState } from "react";

/**
 * Hook to manage global search open/close state with keyboard shortcuts
 */
export function useSearchKeyboard() {
  const [isOpen, setIsOpen] = useState(false);

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

  return { isOpen, setIsOpen };
}

type TabType = "all" | "issues" | "documents";

interface SearchPaginationState {
  query: string;
  setQuery: (query: string) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  issueOffset: number;
  documentOffset: number;
  limit: number;
  loadMore: (issueHasMore: boolean, documentHasMore: boolean) => void;
}

/**
 * Hook to manage search pagination and query state
 */
export function useSearchPagination(isOpen: boolean): SearchPaginationState {
  const [query, setQueryInternal] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [issueOffset, setIssueOffset] = useState(0);
  const [documentOffset, setDocumentOffset] = useState(0);
  const limit = 20;

  // Reset query and offsets when closing
  useEffect(() => {
    if (!isOpen) {
      setQueryInternal("");
      setIssueOffset(0);
      setDocumentOffset(0);
    }
  }, [isOpen]);

  // Wrapped setQuery that also resets offsets
  const setQuery = (newQuery: string) => {
    setQueryInternal(newQuery);
    setIssueOffset(0);
    setDocumentOffset(0);
  };

  const loadMore = (issueHasMore: boolean, documentHasMore: boolean) => {
    const shouldLoadIssues = (activeTab === "all" || activeTab === "issues") && issueHasMore;
    const shouldLoadDocs = (activeTab === "all" || activeTab === "documents") && documentHasMore;

    if (shouldLoadIssues) {
      setIssueOffset((prev) => prev + limit);
    }
    if (shouldLoadDocs) {
      setDocumentOffset((prev) => prev + limit);
    }
  };

  return {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    issueOffset,
    documentOffset,
    limit,
    loadMore,
  };
}
