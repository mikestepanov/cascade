import type { Id } from "../../../convex/_generated/dataModel";
import type { UseListNavigationResult } from "../../hooks/useListNavigation";
import { getPriorityColor, getTypeIcon } from "../../lib/issue-utils";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
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
      <div className="border-b border-gray-200 dark:border-gray-700 px-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => onFilterChange("assigned")}
            className={`pb-2 px-2 border-b-2 transition-colors ${
              issueFilter === "assigned"
                ? "border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                ? "border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="Show created issues"
          >
            Created ({myCreatedIssues?.length || 0})
          </button>
        </div>
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
          <div ref={issueNavigation.listRef} className="space-y-2 max-h-[600px] overflow-y-auto">
            {displayIssues.map((issue, index) => (
              <div
                key={issue._id}
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToProject?.(issue.projectId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNavigateToProject?.(issue.projectId);
                  }
                }}
                {...issueNavigation.getItemProps(index)}
                className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all hover:shadow-md animate-slide-up ${issueNavigation.getItemProps(index).className}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        {issue.key}
                      </span>
                      <span className="text-lg" aria-hidden="true">
                        {getTypeIcon(issue.type)}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(issue.priority, "bg")}`}
                      >
                        {issue.priority}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {issue.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{issue.projectName}</span>
                      <span>•</span>
                      <span>{issue.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
