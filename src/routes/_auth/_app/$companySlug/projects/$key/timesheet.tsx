import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load TimeTrackingPage
const TimeTrackingPage = lazy(() =>
  import("@/components/TimeTracking/TimeTrackingPage").then((m) => ({
    default: m.TimeTrackingPage,
  })),
);

export const Route = createFileRoute("/_auth/_app/$companySlug/projects/$key/timesheet")({
  component: TimesheetPage,
});

function TimesheetPage() {
  const { key } = Route.useParams();
  const project = useQuery(api.projects.getByKey, { key });

  // Loading state
  if (project === undefined) {
    return <LoadingSpinner size="lg" className="mx-auto mt-8" />;
  }

  // Project not found (handled by parent layout, but just in case)
  if (project === null) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto mt-8" />}>
      <TimeTrackingPage projectId={project._id} userRole={project.userRole} />
    </Suspense>
  );
}
