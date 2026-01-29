import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { PageContent, PageLayout } from "@/components/layout";

// Lazy load Settings component
const Settings = lazy(() => import("@/components/Settings").then((m) => ({ default: m.Settings })));

export const Route = createFileRoute("/_auth/_app/$orgSlug/settings/profile")({
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  return (
    <Suspense fallback={<PageContent isLoading>{null}</PageContent>}>
      <PageLayout>
        <Settings />
      </PageLayout>
    </Suspense>
  );
}
