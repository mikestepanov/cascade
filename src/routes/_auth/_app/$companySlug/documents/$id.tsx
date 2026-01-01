import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { DocumentEditor } from "@/components/DocumentEditor";

export const Route = createFileRoute("/_auth/_app/$companySlug/documents/$id")({
  component: DocumentPage,
});

function DocumentPage() {
  const { id } = Route.useParams();

  return (
    <div className="h-full overflow-auto">
      <DocumentEditor documentId={id as Id<"documents">} />
    </div>
  );
}
