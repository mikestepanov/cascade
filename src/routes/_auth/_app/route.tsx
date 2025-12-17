import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

  // Global auth gate - wait for auth to be ready before making any queries
  const onboardingStatus = useQuery(
    api.onboarding.getOnboardingStatus,
    isAuthenticated ? undefined : "skip",
  );

  // Get user's companies to redirect to default
  const userCompanies = useQuery(
    api.companies.getUserCompanies,
    isAuthenticated ? undefined : "skip",
  );

  // Determine redirect targets
  const shouldRedirectToHome = !(isAuthLoading || isAuthenticated);
  const shouldRedirectToOnboarding =
    !isAuthLoading &&
    isAuthenticated &&
    onboardingStatus !== undefined &&
    (onboardingStatus === null || !onboardingStatus.onboardingCompleted);

  // Handle redirects in useEffect to avoid state updates during render
  useEffect(() => {
    if (shouldRedirectToHome) {
      navigate({ to: ROUTES.home });
    } else if (shouldRedirectToOnboarding) {
      navigate({ to: ROUTES.onboarding });
    }
  }, [shouldRedirectToHome, shouldRedirectToOnboarding, navigate]);

  // Loading state
  if (isAuthLoading || onboardingStatus === undefined || userCompanies === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (shouldRedirectToHome) {
    return null;
  }

  // Redirect to onboarding if not completed
  if (shouldRedirectToOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User has no companies - initialize default company
  if (userCompanies.length === 0) {
    return <InitializeCompany />;
  }

  return <Outlet />;
}

// Component to initialize default company for users without one
function InitializeCompany() {
  const navigate = useNavigate();
  const initializeDefaultCompany = useMutation(api.companies.initializeDefaultCompany);
  const initRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Use ref to prevent duplicate initialization calls (survives re-renders)
      if (initRef.current) return;
      initRef.current = true;
      try {
        const result = await initializeDefaultCompany({});
        // Navigate to the new company's dashboard
        if (result.slug) {
          navigate({ to: ROUTES.dashboard(result.slug), replace: true });
        } else {
          // Fallback: reload to trigger company query refresh
          window.location.reload();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create company");
        initRef.current = false; // Allow retry on error
      }
    };
    init();
  }, [initializeDefaultCompany, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2 text-red-600">
            Error
          </Typography>
          <Typography variant="p" color="secondary">
            {error}
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <Typography variant="p" color="secondary" className="mt-4">
          Setting up your project...
        </Typography>
      </div>
    </div>
  );
}
