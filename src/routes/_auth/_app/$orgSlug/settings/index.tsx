import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTE_PATTERNS } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$orgSlug/settings/")({
  beforeLoad: ({ params }) => {
    // Redirect /settings to /settings/profile
    throw redirect({
      to: ROUTE_PATTERNS.settings.profile,
      params: { orgSlug: params.orgSlug },
    });
  },
  component: () => null,
});
