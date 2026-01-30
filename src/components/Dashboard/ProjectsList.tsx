import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
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
  const { orgSlug } = useOrganization();

  const navigateToWorkspace = (projectKey: string) => {
    navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: projectKey },
    });
  };

  const navigateToWorkspaces = () => {
    navigate({ to: ROUTES.workspaces.list.path, params: { orgSlug } });
  };
  const count = projects?.length || 0;
  const workspacesLabel = count === 1 ? "project" : "projects";

  return (
    <Card>
      <CardHeader title="Workspaces" description={`${count} active ${workspacesLabel}`} />
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
          <Flex direction="column" gap="xs" ref={projectNavigation.listRef}>
            {projects.map((project, index) => (
              <button
                key={project._id}
                type="button"
                onClick={() => navigateToWorkspace(project.key)}
                {...projectNavigation.getItemProps(index)}
                className={cn(
                  "w-full text-left p-3 bg-ui-bg-secondary/20 hover:bg-ui-bg-secondary/40 rounded-lg group cursor-pointer transition-colors",
                  projectNavigation.getItemProps(index).className,
                )}
              >
                <Flex justify="between" align="center" gap="sm" className="mb-0.5">
                  <Typography
                    variant="small"
                    className="font-bold text-ui-text truncate group-hover:text-brand:text-brand-muted transition-colors"
                  >
                    {project.name}
                  </Typography>
                  <Badge
                    variant="neutral"
                    className="text-xs uppercase tracking-tighter bg-ui-bg-tertiary/50"
                  >
                    {project.role}
                  </Badge>
                </Flex>
                <div className="text-xs text-ui-text-tertiary uppercase tracking-wider font-bold">
                  {project.myIssues} assigned issues
                </div>
              </button>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
