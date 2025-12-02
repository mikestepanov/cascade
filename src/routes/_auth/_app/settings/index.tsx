import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/_app/settings/")({
  beforeLoad: () => {
    // Redirect /settings to /settings/profile
    throw redirect({ to: "/settings/profile" });
  },
  component: () => null,
});
