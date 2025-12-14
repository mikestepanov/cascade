import { createFileRoute } from "@tanstack/react-router";
import { ProjectsList } from "@/components/ProjectsList";

export const Route = createFileRoute("/_auth/_app/$companySlug/workspaces/")({
  component: WorkspacesListPage,
});

function WorkspacesListPage() {
  return <ProjectsList />;
}
