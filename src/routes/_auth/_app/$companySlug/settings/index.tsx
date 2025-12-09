import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$companySlug/settings/")({
  beforeLoad: ({ params }) => {
    // Redirect /settings to /settings/profile
    throw redirect({ to: ROUTES.settings.profile(params.companySlug) });
  },
  component: () => null,
});
