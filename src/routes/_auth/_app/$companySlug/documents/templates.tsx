import { createFileRoute } from "@tanstack/react-router";
import { DocumentTemplatesManager } from "@/components/DocumentTemplatesManager";

export const Route = createFileRoute("/_auth/_app/$companySlug/documents/templates")({
  component: DocumentTemplatesPage,
});

function DocumentTemplatesPage() {
  return (
    <div className="flex-1 p-6 h-full overflow-y-auto bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
      <div className="max-w-6xl mx-auto">
        <DocumentTemplatesManager />
      </div>
    </div>
  );
}
