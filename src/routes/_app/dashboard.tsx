import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();

  const handleNavigateToProject = (_projectId: Id<"projects">) => {
    // TODO: Navigate to project by key instead of ID
    navigate({ to: "/projects" });
  };

  const handleNavigateToProjects = () => {
    navigate({ to: "/projects" });
  };

  return (
    <Dashboard
      onNavigateToProject={handleNavigateToProject}
      onNavigateToProjects={handleNavigateToProjects}
    />
  );
}
