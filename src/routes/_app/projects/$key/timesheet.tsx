import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load TimeTrackingPage
const TimeTrackingPage = lazy(() =>
  import("@/components/TimeTracking/TimeTrackingPage").then((m) => ({
    default: m.TimeTrackingPage,
  })),
);

export const Route = createFileRoute("/_app/projects/$key/timesheet")({
  component: TimesheetPage,
});

function TimesheetPage() {
  // TODO: Pre-select project based on route param
  // For now, TimeTrackingPage has its own project selector
  return (
    <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto mt-8" />}>
      <TimeTrackingPage />
    </Suspense>
  );
}
