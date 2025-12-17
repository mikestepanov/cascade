import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useCompany } from "@/contexts/CompanyContext";

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/",
)({
  component: ProjectsList,
});

function ProjectsList() {
  const { company } = useCompany();
  const { workspaceSlug, teamSlug } = Route.useParams();

  const team = useQuery(api.teams.getBySlug, {
    companyId: company._id,
    slug: teamSlug,
  });

  // For now, get all company projects, but we'll filter by team later
  const allProjects = useQuery(api.projects.list, { companyId: company._id });

  if (!team || allProjects === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <LoadingSpinner />
      </Flex>
    );
  }

  // TODO: Filter projects by teamId once we migrate data
  const projects = allProjects || [];

  return (
    <Flex direction="column" gap="lg">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <div>
          <Typography variant="h2">Projects</Typography>
          <Typography variant="p" color="secondary">
            Team projects and initiatives
          </Typography>
        </div>
        <Button variant="primary">+ Create Project</Button>
      </Flex>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to organize work"
          action={<Button variant="primary">+ Create Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={ROUTES.workspaces.teams.projects.board(
                company.slug,
                workspaceSlug,
                teamSlug,
                project.key,
              )}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Flex direction="column" gap="md">
                  <Flex justify="space-between" align="start">
                    <Typography variant="h3">{project.name}</Typography>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {project.key}
                    </span>
                  </Flex>

                  {project.description && (
                    <Typography variant="p" color="secondary" className="line-clamp-2">
                      {project.description}
                    </Typography>
                  )}

                  <Flex gap="md" className="text-sm text-gray-500">
                    <span>0 issues</span>
                    <span>•</span>
                    <span>{project.boardType === "kanban" ? "Kanban" : "Scrum"}</span>
                  </Flex>
                </Flex>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Flex>
  );
}
