import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";
import { ROUTE_PATTERNS } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { SkeletonProjectCard } from "../ui/Skeleton";

interface Project {
  _id: Id<"projects">;
  key: string;
  name: string;
  role: string;
  myIssues: number;
  totalIssues: number;
}

interface WorkspacesListProps {
  projects: Project[] | undefined;
  projectNavigation: {
    listRef: React.RefObject<HTMLDivElement | null>;
    getItemProps: (index: number) => {
      className: string;
      [key: string]: unknown;
    };
  };
}

/**
 * Workspaces list for dashboard sidebar
 * Extracted from Dashboard component to reduce complexity
 */
export function WorkspacesList({ projects, projectNavigation }: WorkspacesListProps) {
  const navigate = useNavigate();
  const { companySlug } = useCompany();

  const navigateToWorkspace = (projectKey: string) => {
    navigate({
      to: ROUTE_PATTERNS.projects.board,
      params: { companySlug, key: projectKey },
    });
  };

  const navigateToWorkspaces = () => {
    navigate({ to: ROUTE_PATTERNS.workspaces.list, params: { companySlug } });
  };
  const count = projects?.length || 0;
  const workspacesLabel = count === 1 ? "project" : "projects";

  return (
    <Card>
      <CardHeader title="My Workspaces" description={`${count} ${workspacesLabel}`} />
      <CardBody>
        {!projects ? (
          /* Loading skeleton */
          <Flex direction="column" gap="sm">
            <SkeletonProjectCard />
            <SkeletonProjectCard />
            <SkeletonProjectCard />
          </Flex>
        ) : projects.length === 0 ? (
          <EmptyState
            icon="📂"
            title="No projects"
            description="You're not a member of any projects yet"
            action={{
              label: "Go to Workspaces",
              onClick: navigateToWorkspaces,
            }}
          />
        ) : (
          <Flex direction="column" gap="sm" ref={projectNavigation.listRef}>
            {projects.map((project, index) => (
              <button
                key={project._id}
                type="button"
                onClick={() => navigateToWorkspace(project.key)}
                {...projectNavigation.getItemProps(index)}
                className={cn(
                  "w-full text-left p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark cursor-pointer transition-all hover:shadow-md animate-slide-up",
                  projectNavigation.getItemProps(index).className,
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Flex justify="between" align="center" gap="sm" className="mb-1">
                  <Typography variant="h4" className="font-medium text-ui-text-primary truncate">
                    {project.name}
                  </Typography>
                  <Badge variant="primary" className="capitalize shrink-0">
                    {project.role}
                  </Badge>
                </Flex>
                <div className="text-xs text-ui-text-secondary">
                  {project.myIssues} my issues
                  {project.totalIssues > 0 && ` • ${project.totalIssues} total`}
                </div>
              </button>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
