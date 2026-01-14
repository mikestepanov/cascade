import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTE_PATTERNS } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

  // Get user's companies to check if we need initialization
  const userCompanies = useQuery(
    api.companies.getUserCompanies,
    isAuthenticated ? undefined : "skip",
  );

  // Handle home redirect only (SmartAuthGuard handles onboarding/dashboard transitions)
  useEffect(() => {
    if (!(isAuthLoading || isAuthenticated)) {
      navigate({ to: ROUTE_PATTERNS.home });
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Loading state
  if (isAuthLoading || userCompanies === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    return null;
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
          navigate({
            to: ROUTE_PATTERNS.dashboard,
            params: { companySlug: result.slug },
            replace: true,
          });
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
