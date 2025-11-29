import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load Settings component
const Settings = lazy(() => import("@/components/Settings").then((m) => ({ default: m.Settings })));

export const Route = createFileRoute("/_app/settings/profile")({
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <Settings />
    </Suspense>
  );
}
