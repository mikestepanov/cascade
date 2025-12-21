import { api } from "@convex/_generated/api";
import { Link, useNavigate } from "@tanstack/react-router";
import { useConvex, useQuery } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";
import { CreateProjectFromTemplate } from "./CreateProjectFromTemplate";

export function ProjectsList() {
  const { companyId, companySlug } = useCompany();
  const navigate = useNavigate();
  const convex = useConvex();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // For now, get all company projects
  const allProjects = useQuery(api.projects.list, { companyId: companyId });

  const handleProjectCreated = async (projectId: string) => {
    // Fetch project to get key for navigation
    const project = await convex.query(api.projects.get, { id: projectId as Id<"projects"> });
    if (project) {
      setIsCreateOpen(false);
      await navigate({ to: ROUTES.projects.board(companySlug, project.key) });
    }
  };

  if (allProjects === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <LoadingSpinner />
      </Flex>
    );
  }

  const projects = allProjects || [];

  return (
    <Flex direction="column" gap="lg">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <div>
          <Typography variant="h2">Projects</Typography>
          <Typography variant="p" color="secondary">
            Manage your projects and initiatives
          </Typography>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          + Create Project
        </Button>
      </Flex>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to organize work"
          action={
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              + Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project._id} to={ROUTES.projects.board(companySlug, project.key)}>
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
                    <span>{project.myIssues || 0} issues</span>
                    <span>•</span>
                    <span>{project.boardType === "kanban" ? "Kanban" : "Scrum"}</span>
                  </Flex>
                </Flex>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectFromTemplate
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onProjectCreated={handleProjectCreated}
      />
    </Flex>
  );
}
