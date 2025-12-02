import type { Id } from "../../../convex/_generated/dataModel";
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

interface ProjectsListProps {
  projects: Project[] | undefined;
  projectNavigation: {
    listRef: React.RefObject<HTMLDivElement>;
    getItemProps: (index: number) => {
      tabIndex: number;
      className: string;
    };
  };
  onNavigateToProject?: (projectKey: string) => void;
  onNavigateToProjects?: () => void;
}

/**
 * Projects list for dashboard sidebar
 * Extracted from Dashboard component to reduce complexity
 */
export function ProjectsList({
  projects,
  projectNavigation,
  onNavigateToProject,
  onNavigateToProjects,
}: ProjectsListProps) {
  const count = projects?.length || 0;
  const projectsLabel = count === 1 ? "project" : "projects";

  return (
    <Card>
      <CardHeader title="My Projects" description={`${count} ${projectsLabel}`} />
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
            action={
              onNavigateToProjects
                ? {
                    label: "Go to Projects",
                    onClick: onNavigateToProjects,
                  }
                : undefined
            }
          />
        ) : (
          <Flex direction="column" gap="sm" ref={projectNavigation.listRef}>
            {projects.map((project, index) => (
              <button
                key={project._id}
                type="button"
                onClick={() => onNavigateToProject?.(project.key)}
                {...projectNavigation.getItemProps(index)}
                className={`w-full text-left p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark cursor-pointer transition-all hover:shadow-md animate-slide-up ${projectNavigation.getItemProps(index).className}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Flex justify="between" align="center" gap="sm" className="mb-1">
                  <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                    {project.name}
                  </h4>
                  <Badge variant="primary" className="capitalize flex-shrink-0">
                    {project.role}
                  </Badge>
                </Flex>
                <div className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  {project.myIssues} my issues • {project.totalIssues} total
                </div>
              </button>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
