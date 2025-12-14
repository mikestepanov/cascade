import { useNavigate } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { SkeletonProjectCard } from "../ui/Skeleton";

interface Workspace {
  _id: Id<"workspaces">;
  key: string;
  name: string;
  role: string;
  myIssues: number;
  totalIssues: number;
}

interface WorkspacesListProps {
  workspaces: Workspace[] | undefined;
  workspaceNavigation: {
    listRef: React.RefObject<HTMLDivElement>;
    getItemProps: (index: number) => {
      tabIndex: number;
      className: string;
    };
  };
}

/**
 * Workspaces list for dashboard sidebar
 * Extracted from Dashboard component to reduce complexity
 */
export function WorkspacesList({ workspaces, workspaceNavigation }: WorkspacesListProps) {
  const navigate = useNavigate();
  const { companySlug } = useCompany();

  const navigateToWorkspace = (workspaceKey: string) => {
    navigate({ to: ROUTES.workspaces.board(companySlug, workspaceKey) });
  };

  const navigateToWorkspaces = () => {
    navigate({ to: ROUTES.workspaces.list(companySlug) });
  };
  const count = workspaces?.length || 0;
  const workspacesLabel = count === 1 ? "workspace" : "workspaces";

  return (
    <Card>
      <CardHeader title="My Workspaces" description={`${count} ${workspacesLabel}`} />
      <CardBody>
        {!workspaces ? (
          /* Loading skeleton */
          <Flex direction="column" gap="sm">
            <SkeletonProjectCard />
            <SkeletonProjectCard />
            <SkeletonProjectCard />
          </Flex>
        ) : workspaces.length === 0 ? (
          <EmptyState
            icon="📂"
            title="No workspaces"
            description="You're not a member of any workspaces yet"
            action={{
              label: "Go to Workspaces",
              onClick: navigateToWorkspaces,
            }}
          />
        ) : (
          <Flex direction="column" gap="sm" ref={workspaceNavigation.listRef}>
            {workspaces.map((workspace, index) => (
              <button
                key={workspace._id}
                type="button"
                onClick={() => navigateToWorkspace(workspace.key)}
                {...workspaceNavigation.getItemProps(index)}
                className={`w-full text-left p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark cursor-pointer transition-all hover:shadow-md animate-slide-up ${workspaceNavigation.getItemProps(index).className}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Flex justify="between" align="center" gap="sm" className="mb-1">
                  <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                    {workspace.name}
                  </h4>
                  <Badge variant="primary" className="capitalize flex-shrink-0">
                    {workspace.role}
                  </Badge>
                </Flex>
                <div className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  {workspace.myIssues} my issues • {workspace.totalIssues} total
                </div>
              </button>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
