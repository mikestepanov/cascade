import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/projects/$key/")({
  beforeLoad: ({ params }) => {
    // Redirect /projects/:key to /projects/:key/board
    throw redirect({ to: `/projects/${params.key}/board` });
  },
  component: () => null,
});
