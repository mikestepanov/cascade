import { useMutation, useQuery } from "convex/react";
import { useAsyncMutation, useDeleteConfirmation, useEntityForm, useModal } from "@/hooks";
import { showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ColorPicker } from "./ui/ColorPicker";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";
import { Flex } from "./ui/Flex";
import { Input } from "./ui/form";
import { Modal } from "./ui/Modal";

interface LabelsManagerProps {
  projectId: Id<"projects">;
}

interface LabelFormData {
  name: string;
  color: string;
}

// Default to brand-500 color from theme
const DEFAULT_LABEL_COLOR = "#6366F1";

const DEFAULT_FORM: LabelFormData = {
  name: "",
  color: DEFAULT_LABEL_COLOR,
};

export function LabelsManager({ projectId }: LabelsManagerProps) {
  // Data
  const labels = useQuery(api.labels.list, { projectId });

  // Form state
  const modal = useModal();
  const form = useEntityForm<LabelFormData>(DEFAULT_FORM);

  // Mutations with loading states
  const createLabel = useMutation(api.labels.create);
  const updateLabel = useMutation(api.labels.update);
  const deleteLabelMutation = useMutation(api.labels.remove);

  const { mutate: submitForm, isLoading: isSubmitting } = useAsyncMutation(
    async () => {
      if (!form.formData.name.trim()) return;

      if (form.editingId) {
        await updateLabel({
          id: form.editingId as Id<"labels">,
          name: form.formData.name.trim(),
          color: form.formData.color,
        });
        showSuccess("Label updated");
      } else {
        await createLabel({
          projectId,
          name: form.formData.name.trim(),
          color: form.formData.color,
        });
        showSuccess("Label created");
      }
      handleCloseModal();
    },
    { errorMessage: "Failed to save label" },
  );

  // Delete confirmation
  const deleteConfirm = useDeleteConfirmation<"labels">({
    successMessage: "Label deleted",
    errorMessage: "Failed to delete label",
  });

  const handleCloseModal = () => {
    modal.close();
    form.resetForm();
  };

  const handleCreate = () => {
    form.startCreate();
    modal.open();
  };

  const handleEdit = (label: { _id: Id<"labels">; name: string; color: string }) => {
    form.loadForEdit({ _id: label._id, name: label.name, color: label.color });
    modal.open();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Labels"
          description="Organize issues with colored labels"
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
              New Label
            </Button>
          }
        />

        <CardBody>
          {!labels || labels.length === 0 ? (
            <EmptyState
              icon="🏷️"
              title="No labels yet"
              description="Create labels to organize your issues"
              action={{
                label: "Create Your First Label",
                onClick: handleCreate,
              }}
            />
          ) : (
            <Flex direction="column" gap="sm">
              {labels.map((label) => (
                <Flex
                  key={label._id}
                  justify="between"
                  align="center"
                  className="p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark transition-colors"
                >
                  <Flex gap="md" align="center">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                    <span className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                      {label.color}
                    </span>
                  </Flex>

                  <Flex gap="sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(label)}
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteConfirm.confirmDelete(label._id)}
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      }
                    >
                      Delete
                    </Button>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        title={form.editingId ? "Edit Label" : "Create Label"}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="lg" className="p-6">
            <Input
              label="Label Name"
              value={form.formData.name}
              onChange={(e) => form.updateField("name", e.target.value)}
              placeholder="e.g., bug, feature, urgent"
              required
              autoFocus
            />

            <ColorPicker
              value={form.formData.color}
              onChange={(color) => form.updateField("color", color)}
              label="Color"
            />

            {/* Preview */}
            <div>
              <div className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
                Preview
              </div>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: form.formData.color }}
              >
                {form.formData.name || "Label name"}
              </span>
            </div>

            <Flex gap="sm" className="pt-4">
              <Button type="submit" isLoading={isSubmitting}>
                {form.editingId ? "Update" : "Create"} Label
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Flex>
          </Flex>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm.deleteId}
        onClose={deleteConfirm.cancelDelete}
        onConfirm={() => deleteConfirm.executeDelete((id) => deleteLabelMutation({ id }))}
        title="Delete Label"
        message="Are you sure you want to delete this label? It will be removed from all issues."
        variant="danger"
        confirmLabel="Delete"
        isLoading={deleteConfirm.isDeleting}
      />
    </>
  );
}
