import { createFileRoute } from "@tanstack/react-router";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/")({
  component: DocumentsListPage,
});

function DocumentsListPage() {
  return (
    <PageLayout>
      <PageHeader title="Documents" description="Create and manage documents" />
      <PageContent
        isEmpty
        emptyState={{
          icon: "📄",
          title: "Welcome to your project",
          description: "Select a document from the sidebar or create a new one to get started.",
        }}
      >
        {null}
      </PageContent>
    </PageLayout>
  );
}
