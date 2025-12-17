import { createFileRoute } from "@tanstack/react-router";
import { ProjectBoard } from "@/components/ProjectBoard";

export const Route = createFileRoute("/_auth/_app/$companySlug/projects/$key/board")({
  component: BoardPage,
});

function BoardPage() {
  const { key } = Route.useParams();

  return <ProjectBoard projectKey={key} />;
}
