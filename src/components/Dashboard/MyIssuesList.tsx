import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";
import { ROUTE_PATTERNS } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";
import type { useListNavigation } from "@/hooks/useListNavigation";
import { cn } from "@/lib/utils";
import { getPriorityColor, getTypeIcon } from "../../lib/issue-utils";
import { Badge } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { LoadMoreButton } from "../ui/LoadMoreButton";
import { SkeletonList } from "../ui/Skeleton";

type IssueFilter = "assigned" | "created" | "all";

interface Issue {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  projectId: Id<"projects">;
  projectKey: string;
  projectName: string;
}

interface MyIssuesListProps {
  myIssues: Issue[] | undefined;
  myCreatedIssues: Issue[] | undefined;
  displayIssues: Issue[] | undefined;
  issueFilter: IssueFilter;
  onFilterChange: (filter: IssueFilter) => void;
  issueNavigation: ReturnType<typeof useListNavigation<Issue>>;
  // Pagination props
  loadMore?: (numItems: number) => void;
  status?: "CanLoadMore" | "LoadingMore" | "Exhausted" | "LoadingFirstPage";
}

/**
 * Dashboard issues list with tabs for assigned/created issues
 */
export function MyIssuesList({
  myIssues,
  myCreatedIssues,
  displayIssues,
  issueFilter,
  onFilterChange,
  issueNavigation,
  loadMore,
  status,
}: MyIssuesListProps) {
  const navigate = useNavigate();
  const { companySlug } = useCompany();

  const navigateToWorkspace = (projectKey: string) => {
    navigate({
      to: ROUTE_PATTERNS.projects.board,
      params: { companySlug, key: projectKey },
    });
  };

  const navigateToWorkspaces = () => {
    navigate({
      to: ROUTE_PATTERNS.workspaces.list,
      params: { companySlug },
    });
  };

  const showLoadMore = issueFilter === "assigned" && status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  return (
    <Card>
      <CardHeader title="My Issues" description="Track your assigned and created issues" />
      <div className="border-b border-ui-border-primary px-4">
        <Flex gap="lg">
          <button
            type="button"
            onClick={() => onFilterChange("assigned")}
            className={cn(
              "pb-2 px-2 border-b-2 transition-colors",
              issueFilter === "assigned"
                ? "border-brand-indigo-border text-brand-indigo-text"
                : "border-transparent text-ui-text-secondary hover:text-ui-text-primary",
            )}
            aria-label="Show assigned issues"
          >
            Assigned ({myIssues?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("created")}
            className={cn(
              "pb-2 px-2 border-b-2 transition-colors",
              issueFilter === "created"
                ? "border-brand-indigo-border text-brand-indigo-text"
                : "border-transparent text-ui-text-secondary hover:text-ui-text-primary",
            )}
            aria-label="Show created issues"
          >
            Created ({myCreatedIssues?.length || 0})
          </button>
        </Flex>
      </div>
      <CardBody>
        {!displayIssues ? (
          /* Loading skeleton */
          <SkeletonList items={5} />
        ) : displayIssues.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No issues found"
            description={
              issueFilter === "assigned"
                ? "You don't have any assigned issues. Visit a project to get started."
                : "You haven't created any issues yet. Visit a project to create one."
            }
            action={{
              label: "View My Workspaces",
              onClick: navigateToWorkspaces,
            }}
          />
        ) : (
          <Flex
            direction="column"
            gap="sm"
            className="max-h-[600px] overflow-y-auto"
            ref={issueNavigation.listRef}
          >
            {displayIssues.map((issue, index) => (
              <button
                key={issue._id}
                type="button"
                onClick={() => navigateToWorkspace(issue.projectKey)}
                {...issueNavigation.getItemProps(index)}
                className={cn(
                  "w-full text-left p-3 bg-ui-bg-secondary rounded-lg hover:bg-ui-bg-tertiary cursor-pointer transition-all hover:shadow-md animate-slide-up",
                  issueNavigation.getItemProps(index).className,
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Flex justify="between" align="start">
                  <div className="flex-1">
                    <Flex gap="sm" align="center" className="mb-1">
                      <span className="text-sm font-mono text-ui-text-secondary">{issue.key}</span>
                      <span className="text-lg" aria-hidden="true">
                        {getTypeIcon(issue.type)}
                      </span>
                      <Badge shape="pill" className={getPriorityColor(issue.priority, "bg")}>
                        {issue.priority}
                      </Badge>
                    </Flex>
                    <Typography variant="h4" className="font-medium text-ui-text-primary mb-1">
                      {issue.title}
                    </Typography>
                    <Flex gap="sm" align="center" className="text-xs text-ui-text-secondary">
                      <span>{issue.projectName}</span>
                      <span>•</span>
                      <span>{issue.status}</span>
                    </Flex>
                  </div>
                </Flex>
              </button>
            ))}

            {showLoadMore && loadMore && (
              <div className="pt-2 pb-2">
                <LoadMoreButton
                  onClick={() => loadMore(20)}
                  isLoading={isLoadingMore}
                  className="w-full"
                />
              </div>
            )}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
