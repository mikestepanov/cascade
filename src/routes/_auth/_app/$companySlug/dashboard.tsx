import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";

export const Route = createFileRoute("/_auth/_app/$companySlug/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return <Dashboard />;
}
