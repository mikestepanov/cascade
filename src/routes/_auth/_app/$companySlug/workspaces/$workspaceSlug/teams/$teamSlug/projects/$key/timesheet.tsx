import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load the timesheet component for better performance
const ProjectTimesheet = React.lazy(() => import("@/components/TimeTracking/ProjectTimesheet"));

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/timesheet",
)({
  component: TimesheetPage,
});

function TimesheetPage() {
  const { key } = Route.useParams();

  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner message="Loading timesheet..." />
        </div>
      }
    >
      <ProjectTimesheet projectKey={key} />
    </React.Suspense>
  );
}
