import { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

// Type helper for paginated queries with custom return types
type PaginatedQuery = FunctionReference<"query", "public">;

interface ProjectsListProps {
  onCreateClick: () => void;
}

export function ProjectsList({ onCreateClick }: ProjectsListProps) {
  const { organizationId, orgSlug } = useOrganization();

  // Paginated projects list
  const {
    results: projects,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.projects.getCurrentUserProjects as PaginatedQuery,
    { organizationId },
    { initialNumItems: 20 },
  );

  if (status === "LoadingFirstPage") {
    return (
      <Flex direction="column" align="center" justify="center" className="min-h-100">
        <LoadingSpinner />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="lg">
      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          description="Create your first project to organize work"
          action={
            <Button variant="primary" onClick={onCreateClick}>
              + Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={ROUTES.projects.board.path}
              params={{ orgSlug, key: project.key }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Flex direction="column" gap="md">
                  <Flex justify="between" align="start">
                    <Typography variant="h3">{project.name}</Typography>
                    <Typography variant="inlineCode">{project.key}</Typography>
                  </Flex>

                  {project.description && (
                    <Typography variant="p" color="secondary" className="line-clamp-2">
                      {project.description}
                    </Typography>
                  )}

                  <Typography variant="muted" className="text-sm">
                    {project.myIssues || 0} issues •{" "}
                    {project.boardType === "kanban" ? "Kanban" : "Scrum"}
                  </Typography>
                </Flex>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {status === "CanLoadMore" && (
        <Flex justify="center" className="mt-8">
          <Button variant="outline" onClick={() => loadMore(20)}>
            Load More Projects
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
