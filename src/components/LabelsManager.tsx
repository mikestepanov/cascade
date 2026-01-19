import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, Trash } from "lucide-react";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useModal } from "@/hooks/useModal";
import { showSuccess } from "@/lib/toast";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ColorPicker } from "./ui/ColorPicker";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/Dialog";
import { EmptyState } from "./ui/EmptyState";
import { Flex } from "./ui/Flex";
import { Input } from "./ui/form";

interface LabelsManagerProps {
  projectId: Id<"projects">;
}

interface LabelFormData {
  name: string;
  color: string;
  [key: string]: unknown;
}

// Default to brand-500 equivalent color
const DEFAULT_LABEL_COLOR = "#6366F1"; // matches --color-brand-500

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
            <Button onClick={handleCreate} leftIcon={<Plus className="w-4 h-4" />}>
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
              {labels.map((label: Doc<"labels">) => (
                <Flex
                  key={label._id}
                  justify="between"
                  align="center"
                  className="p-3 bg-ui-bg-secondary rounded-lg hover:bg-ui-bg-tertiary transition-colors"
                >
                  <Flex gap="md" align="center">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                    <span className="text-xs text-ui-text-tertiary">{label.color}</span>
                  </Flex>

                  <Flex gap="sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(label)}
                      leftIcon={<Pencil className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteConfirm.confirmDelete(label._id)}
                      leftIcon={<Trash className="w-4 h-4" />}
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
      <Dialog open={modal.isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.editingId ? "Edit Label" : "Create Label"}</DialogTitle>
          </DialogHeader>
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
                <div className="block text-sm font-medium text-ui-text-primary mb-2">Preview</div>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: form.formData.color }}
                >
                  {form.formData.name || "Label name"}
                </span>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {form.editingId ? "Update" : "Create"} Label
                </Button>
              </DialogFooter>
            </Flex>
          </form>
        </DialogContent>
      </Dialog>

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
