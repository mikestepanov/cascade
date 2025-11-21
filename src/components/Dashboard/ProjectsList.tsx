import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonProjectCard } from "../ui/Skeleton";

interface Project {
  _id: Id<"projects">;
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
  onNavigateToProject?: (projectId: Id<"projects">) => void;
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
  return (
    <Card>
      <CardHeader title="My Projects" description={`${projects?.length || 0} projects`} />
      <CardBody>
        {!projects ? (
          /* Loading skeleton */
          <div className="space-y-2">
            <SkeletonProjectCard />
            <SkeletonProjectCard />
            <SkeletonProjectCard />
          </div>
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
          <div ref={projectNavigation.listRef} className="space-y-2">
            {projects.map((project, index) => (
              <button
                key={project._id}
                type="button"
                onClick={() => onNavigateToProject?.(project._id)}
                {...projectNavigation.getItemProps(index)}
                className={`w-full text-left p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark cursor-pointer transition-all hover:shadow-md animate-slide-up ${projectNavigation.getItemProps(index).className}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                    {project.name}
                  </h4>
                  <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 rounded capitalize flex-shrink-0">
                    {project.role}
                  </span>
                </div>
                <div className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  {project.myIssues} my issues • {project.totalIssues} total
                </div>
              </button>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
