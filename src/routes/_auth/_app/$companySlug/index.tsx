import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTE_PATTERNS, ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$companySlug/")({
  beforeLoad: ({ params }) => {
    // Redirect /:companySlug to /:companySlug/dashboard
    throw redirect({
      to: ROUTE_PATTERNS.dashboard,
      params: { companySlug: params.companySlug },
    });
  },
  component: () => null,
});
