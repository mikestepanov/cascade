import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTE_PATTERNS, ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$companySlug/settings/")({
  beforeLoad: ({ params }) => {
    // Redirect /settings to /settings/profile
    throw redirect({
      to: ROUTE_PATTERNS.settings.profile,
      params: { companySlug: params.companySlug },
    });
  },
  component: () => null,
});
