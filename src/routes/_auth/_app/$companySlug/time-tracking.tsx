import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { TimeTrackingPage } from "@/components/TimeTracking/TimeTrackingPage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$companySlug/time-tracking")({
  component: TimeTrackingPageRoute,
});

function TimeTrackingPageRoute() {
  const { companySlug } = Route.useParams();
  const navigate = useNavigate();
  const isAdmin = useQuery(api.users.isCompanyAdmin);

  // Redirect non-admins to dashboard
  useEffect(() => {
    if (isAdmin === false) {
      navigate({ to: ROUTES.dashboard(companySlug) });
    }
  }, [isAdmin, companySlug, navigate]);

  // Loading state
  if (isAdmin === undefined) {
    return <LoadingSpinner size="lg" className="mx-auto mt-8" />;
  }

  // Not admin - will redirect
  if (!isAdmin) {
    return null;
  }

  // Platform admin - show all tabs
  return <TimeTrackingPage isGlobalAdmin />;
}
