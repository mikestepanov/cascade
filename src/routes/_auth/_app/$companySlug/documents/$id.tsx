import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load DocumentEditor (heavy - includes BlockNote)
const DocumentEditor = lazy(() =>
  import("@/components/DocumentEditor").then((m) => ({
    default: m.DocumentEditor,
  })),
);

export const Route = createFileRoute("/_auth/_app/$companySlug/documents/$id")({
  component: DocumentPage,
});

function DocumentPage() {
  const { id } = Route.useParams();

  return (
    <div className="h-full overflow-auto">
      <ErrorBoundary>
        <Suspense
          key={id} // Force remount on document change to avoid stale error states
          fallback={
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <DocumentEditor documentId={id as Id<"documents">} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
