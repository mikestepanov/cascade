import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Id } from "../../../../convex/_generated/dataModel";

// Lazy load DocumentEditor (heavy - includes BlockNote)
const DocumentEditor = lazy(() =>
  import("@/components/DocumentEditor").then((m) => ({
    default: m.DocumentEditor,
  })),
);

export const Route = createFileRoute("/_auth/_app/documents/$id")({
  component: DocumentPage,
});

function DocumentPage() {
  const { id } = Route.useParams();

  return (
    <div className="h-full overflow-auto">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <DocumentEditor documentId={id as Id<"documents">} />
      </Suspense>
    </div>
  );
}
