import { api } from "@convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ROUTES } from "@/config/routes";

/**
 * Component that redirects authenticated users to their first company's dashboard.
 * Use this inside <Authenticated> blocks instead of a static Navigate.
 */
export function PostAuthRedirect() {
  const navigate = useNavigate();
  const userCompanies = useQuery(api.companies.getUserCompanies);
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  useEffect(() => {
    // Wait for data to load
    if (userCompanies === undefined || onboardingStatus === undefined) {
      return;
    }

    // New user or incomplete onboarding → go to onboarding
    if (onboardingStatus === null || !onboardingStatus.onboardingCompleted) {
      navigate({ to: ROUTES.onboarding, replace: true });
      return;
    }

    // User has companies → go to first company's dashboard
    if (userCompanies.length > 0) {
      navigate({ to: ROUTES.dashboard(userCompanies[0].slug), replace: true });
      return;
    }

    // Edge case: onboarding complete but no companies
    // This shouldn't happen, but redirect to onboarding to fix state
    navigate({ to: ROUTES.onboarding, replace: true });
  }, [userCompanies, onboardingStatus, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
      <LoadingSpinner size="lg" />
    </div>
  );
}
