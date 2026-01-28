import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useMemo, useState } from "react";
import { CreateIssueModal } from "@/components/CreateIssueModal";
import { IssueCard } from "@/components/IssueCard";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { useOrganization } from "@/hooks/useOrgContext";
import { Filter, Plus, Search } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/issues/")({
  component: AllIssuesPage,
});

function AllIssuesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<Id<"issues"> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const { organizationId } = useOrganization();

  const {
    results: issues,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.issues.listOrganizationIssues,
    organizationId ? { status: statusFilter, organizationId } : "skip",
    { initialNumItems: 20 },
  );

  const isLoading = status === "LoadingFirstPage";

  // Client-side search filtering
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues;
    const query = searchQuery.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.title.toLowerCase().includes(query) || issue.key.toLowerCase().includes(query),
    );
  }, [issues, searchQuery]);

  const handleIssueClick = (id: Id<"issues">) => {
    setSelectedIssueId(id);
  };

  const handleCloseDetail = () => {
    setSelectedIssueId(null);
  };

  return (
    <div className="p-6">
      <Flex align="center" justify="between" className="mb-8">
        <div>
          <Typography variant="h1" className="text-2xl font-bold">
            Issues
          </Typography>
          <Typography variant="p" color="secondary">
            All issues across your organization
          </Typography>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create Issue
        </Button>
      </Flex>

      {/* Filters & Search */}
      <Flex
        gap="md"
        className="mb-6 bg-ui-bg-primary p-4 rounded-lg border border-ui-border-primary"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-text-tertiary" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-ui-bg-secondary border border-ui-border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <Flex gap="sm" align="center">
          <Filter className="w-4 h-4 text-ui-text-tertiary" />
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="bg-ui-bg-secondary border border-ui-border-primary rounded-md px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </Flex>
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex align="center" justify="center" className="min-h-[400px]">
          <LoadingSpinner size="lg" />
        </Flex>
      ) : filteredIssues.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          className="min-h-[400px] text-center"
        >
          <Typography variant="h3" color="secondary" className="mb-2">
            No issues found
          </Typography>
          <Typography variant="p" color="tertiary">
            Try adjusting your filters or create a new issue.
          </Typography>
        </Flex>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue as Parameters<typeof IssueCard>[0]["issue"]}
              onDragStart={() => {
                /* Dragging not supported in global view */
              }}
              onClick={handleIssueClick}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {status === "CanLoadMore" && (
        <Flex justify="center" className="mt-8">
          <Button variant="secondary" onClick={() => loadMore(20)}>
            Load More
          </Button>
        </Flex>
      )}

      <CreateIssueModal open={showCreateModal} onOpenChange={setShowCreateModal} />

      {selectedIssueId !== null && (
        <IssueDetailModal
          issueId={selectedIssueId}
          open={selectedIssueId !== null}
          onOpenChange={handleCloseDetail}
        />
      )}
    </div>
  );
}
