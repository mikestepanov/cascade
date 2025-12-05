import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ProjectBoard } from "@/components/ProjectBoard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export const Route = createFileRoute("/_auth/_app/projects/$key/board")({
  component: BoardPage,
});

function BoardPage() {
  const { key } = Route.useParams();
  const project = useQuery(api.projects.getByKey, { key });

  if (project === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (project === null) {
    return null; // Parent layout handles this
  }

  return <ProjectBoard projectId={project._id} />;
}
