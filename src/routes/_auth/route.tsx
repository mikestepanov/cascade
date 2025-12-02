import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  ssr: false,
});

function AuthLayout() {
  return (
    <>
      <Authenticated>
        <Outlet />
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/" />
      </Unauthenticated>
    </>
  );
}
