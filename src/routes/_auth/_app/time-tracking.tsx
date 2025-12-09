import { createFileRoute } from "@tanstack/react-router";
import { TimeTrackingPage } from "@/components/TimeTracking/TimeTrackingPage";

export const Route = createFileRoute("/_auth/_app/time-tracking")({
  component: TimeTrackingPageRoute,
});

function TimeTrackingPageRoute() {
  return <TimeTrackingPage />;
}
