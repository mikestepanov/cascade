import type { Id } from "../../../convex/_generated/dataModel";
import type { UseListNavigationResult } from "../../hooks/useListNavigation";
import { getPriorityColor, getTypeIcon } from "../../lib/issue-utils";
import { Badge } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
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
  projectName: string;
}

interface MyIssuesListProps {
  myIssues: Issue[] | undefined;
  myCreatedIssues: Issue[] | undefined;
  displayIssues: Issue[] | undefined;
  issueFilter: IssueFilter;
  onFilterChange: (filter: IssueFilter) => void;
  issueNavigation: UseListNavigationResult<Issue>;
  onNavigateToProject?: (projectId: Id<"projects">) => void;
  onNavigateToProjects?: () => void;
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
  onNavigateToProject,
  onNavigateToProjects,
}: MyIssuesListProps) {
  return (
    <Card>
      <CardHeader title="My Issues" description="Track your assigned and created issues" />
      <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark px-4">
        <Flex gap="lg">
          <button
            type="button"
            onClick={() => onFilterChange("assigned")}
            className={`pb-2 px-2 border-b-2 transition-colors ${
              issueFilter === "assigned"
                ? "border-brand-600 dark:border-brand-500 text-brand-600 dark:text-brand-500"
                : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
            aria-label="Show assigned issues"
          >
            Assigned ({myIssues?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("created")}
            className={`pb-2 px-2 border-b-2 transition-colors ${
              issueFilter === "created"
                ? "border-brand-600 dark:border-brand-500 text-brand-600 dark:text-brand-500"
                : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
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
            action={
              onNavigateToProjects
                ? {
                    label: "View My Projects",
                    onClick: onNavigateToProjects,
                  }
                : undefined
            }
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
                onClick={() => onNavigateToProject?.(issue.projectId)}
                {...issueNavigation.getItemProps(index)}
                className={`w-full text-left p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark cursor-pointer transition-all hover:shadow-md animate-slide-up ${issueNavigation.getItemProps(index).className}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Flex justify="between" align="start">
                  <div className="flex-1">
                    <Flex gap="sm" align="center" className="mb-1">
                      <span className="text-sm font-mono text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        {issue.key}
                      </span>
                      <span className="text-lg" aria-hidden="true">
                        {getTypeIcon(issue.type)}
                      </span>
                      <Badge shape="pill" className={getPriorityColor(issue.priority, "bg")}>
                        {issue.priority}
                      </Badge>
                    </Flex>
                    <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                      {issue.title}
                    </h4>
                    <Flex
                      gap="sm"
                      align="center"
                      className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark"
                    >
                      <span>{issue.projectName}</span>
                      <span>•</span>
                      <span>{issue.status}</span>
                    </Flex>
                  </div>
                </Flex>
              </button>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
