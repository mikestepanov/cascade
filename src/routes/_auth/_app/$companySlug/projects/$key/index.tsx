import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$companySlug/projects/$key/")({
  beforeLoad: ({ params }) => {
    // Redirect /projects/:key to /projects/:key/board
    throw redirect({ to: ROUTES.projects.board(params.companySlug, params.key) });
  },
  component: () => null,
});
