import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTE_PATTERNS } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$orgSlug/")({
  beforeLoad: ({ params }) => {
    // Redirect /:orgSlug to /:orgSlug/dashboard
    throw redirect({
      to: ROUTE_PATTERNS.dashboard,
      params: { orgSlug: params.orgSlug },
    });
  },
  component: () => null,
});
