import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { UnifiedCalendarView } from "@/components/Calendar/UnifiedCalendarView";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/_auth/_app/projects/$key/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
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

  return <UnifiedCalendarView projectId={project._id} />;
}
