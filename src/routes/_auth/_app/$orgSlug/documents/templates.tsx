import { createFileRoute } from "@tanstack/react-router";
import { DocumentTemplatesManager } from "@/components/DocumentTemplatesManager";
import { PageLayout } from "@/components/layout";

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/templates")({
  component: DocumentTemplatesPage,
});

function DocumentTemplatesPage() {
  return (
    <PageLayout maxWidth="lg">
      <DocumentTemplatesManager />
    </PageLayout>
  );
}
