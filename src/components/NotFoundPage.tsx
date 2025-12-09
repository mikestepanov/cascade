import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
      <h1 className="text-6xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
        404
      </h1>
      <p className="mt-4 text-xl text-ui-text-secondary dark:text-ui-text-secondary-dark">
        Page not found
      </p>
      <Link
        to={ROUTES.home}
        className="mt-8 rounded-lg bg-ui-brand px-6 py-3 text-white transition-colors hover:bg-ui-brand-hover"
      >
        Go home
      </Link>
    </div>
  );
}
