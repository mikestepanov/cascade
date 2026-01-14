import { Link } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";
import { ROUTE_PATTERNS } from "@/config/routes";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ui-bg-secondary">
      <Typography variant="h1" className="text-6xl text-ui-text-primary">
        404
      </Typography>
      <Typography variant="lead" className="mt-4">
        Page not found
      </Typography>
      <Link
        to={ROUTE_PATTERNS.home}
        className="mt-8 rounded-lg bg-ui-brand px-6 py-3 text-white transition-colors hover:bg-ui-brand-hover"
      >
        Go home
      </Link>
    </div>
  );
}
