import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ColorPicker } from "./ui/ColorPicker";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";
import { InputField } from "./ui/FormField";
import { Modal } from "./ui/Modal";

interface LabelsManagerProps {
  projectId: Id<"projects">;
}

export function LabelsManager({ projectId }: LabelsManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<Id<"labels"> | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"labels"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labels = useQuery(api.labels.list, { projectId });
  const createLabel = useMutation(api.labels.create);
  const updateLabel = useMutation(api.labels.update);
  const deleteLabel = useMutation(api.labels.remove);

  const resetForm = () => {
    setName("");
    setColor("#3B82F6");
    setEditingId(null);
    setShowModal(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateLabel({ id: editingId, name: name.trim(), color });
        toast.success("Label updated");
      } else {
        await createLabel({ projectId, name: name.trim(), color });
        toast.success("Label created");
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save label");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (label: { _id: Id<"labels">; name: string; color: string }) => {
    setEditingId(label._id);
    setName(label.name);
    setColor(label.color);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteLabel({ id: deleteConfirm });
      toast.success("Label deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete label");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Labels"
          description="Organize issues with colored labels"
          action={
            <Button
              onClick={() => setShowModal(true)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            />
          ) : (
            <div className="space-y-2">
              {labels.map((label) => (
                <div
                  key={label._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                    <span className="text-xs text-gray-500">{label.color}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(label)}
                      leftIcon={
                        <svg
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
                      onClick={() => setDeleteConfirm(label._id)}
                      leftIcon={
                        <svg
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingId ? "Edit Label" : "Create Label"}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <InputField
            label="Label Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., bug, feature, urgent"
            required
            autoFocus
          />

          <ColorPicker value={color} onChange={setColor} label="Color" />

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {name || "Label name"}
            </span>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" isLoading={isSubmitting}>
              {editingId ? "Update" : "Create"} Label
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Label"
        message="Are you sure you want to delete this label? It will be removed from all issues."
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}
