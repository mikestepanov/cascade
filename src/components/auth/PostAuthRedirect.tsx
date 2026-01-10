import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/**
 * Component that redirects authenticated users to their first company's dashboard.
 * Use this inside <Authenticated> blocks instead of a static Navigate.
 */
export function PostAuthRedirect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
      <LoadingSpinner size="lg" />
    </div>
  );
}
