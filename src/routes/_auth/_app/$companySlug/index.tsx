import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$companySlug/")({
  beforeLoad: ({ params }) => {
    // Redirect /:companySlug to /:companySlug/dashboard
    throw redirect({ to: ROUTES.dashboard(params.companySlug) });
  },
  component: () => null,
});
