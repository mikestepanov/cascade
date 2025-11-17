import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { TemplateCard } from "./templates/TemplateCard";
import { TemplateForm } from "./templates/TemplateForm";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";

interface TemplatesManagerProps {
  projectId: Id<"projects">;
}

type IssueTemplate = {
  _id: Id<"issueTemplates">;
  name: string;
  type: "task" | "bug" | "story" | "epic";
  titleTemplate: string;
  descriptionTemplate: string;
  defaultPriority: "lowest" | "low" | "medium" | "high" | "highest";
  defaultLabels?: string[];
};

/**
 * Refactored TemplatesManager - Now focused on orchestration
 * Form and card logic extracted to separate components
 *
 * Benefits:
 * - Reduced from 356 lines (17 hooks!) to ~100 lines
 * - Form logic reusable in other contexts
 * - Card component testable in isolation
 * - Consistent with other refactored Manager components
 */
export function TemplatesManager({ projectId }: TemplatesManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IssueTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"issueTemplates"> | null>(null);

  const templates = useQuery(api.templates.list, { projectId });
  const deleteTemplate = useMutation(api.templates.remove);

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleEdit = (template: IssueTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteTemplate({ id: deleteConfirm });
      toast.success("Template deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete template");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCloseForm = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Issue Templates"
          description="Create reusable templates for common issue types"
          action={
            <Button
              onClick={handleCreate}
              leftIcon={
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              }
            >
              New Template
            </Button>
          }
        />

        <CardBody>
          {!templates || templates.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No templates yet"
              description="Create templates to speed up issue creation"
            />
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  onEdit={() => handleEdit(template)}
                  onDelete={() => setDeleteConfirm(template._id)}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Form */}
      <TemplateForm
        projectId={projectId}
        template={editingTemplate}
        isOpen={showModal}
        onClose={handleCloseForm}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}
