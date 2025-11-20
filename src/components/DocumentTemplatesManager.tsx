import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";
import { InputField, SelectField, TextareaField } from "./ui/FormField";
import { Modal } from "./ui/Modal";

interface DocumentTemplatesManagerProps {
  projectId?: Id<"projects">;
  onSelectTemplate?: (templateId: Id<"documentTemplates">) => void;
}

export function DocumentTemplatesManager({
  projectId,
  onSelectTemplate,
}: DocumentTemplatesManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<Id<"documentTemplates"> | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("planning");
  const [icon, setIcon] = useState("📄");
  const [isPublic, setIsPublic] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"documentTemplates"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const templates = useQuery(api.documentTemplates.list, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
    projectId,
  });
  const createTemplate = useMutation(api.documentTemplates.create);
  const updateTemplate = useMutation(api.documentTemplates.update);
  const deleteTemplate = useMutation(api.documentTemplates.remove);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("planning");
    setIcon("📄");
    setIsPublic(false);
    setEditingId(null);
    setShowModal(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const templateData = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: name }],
            },
            { type: "paragraph", content: [] },
          ],
        }, // Empty template content
        isPublic,
        projectId,
      };

      if (editingId) {
        await updateTemplate({
          id: editingId,
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          icon: templateData.icon,
          isPublic: templateData.isPublic,
        });
        showSuccess("Template updated");
      } else {
        await createTemplate(templateData);
        showSuccess("Template created");
      }
      resetForm();
    } catch (error) {
      showError(error, "Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (template: {
    _id: Id<"documentTemplates">;
    name: string;
    description?: string;
    category: string;
    icon: string;
    isPublic: boolean;
  }) => {
    setEditingId(template._id);
    setName(template.name);
    setDescription(template.description || "");
    setCategory(template.category);
    setIcon(template.icon);
    setIsPublic(template.isPublic);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteTemplate({ id: deleteConfirm });
      showSuccess("Template deleted");
    } catch (error) {
      showError(error, "Failed to delete template");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "meeting", label: "Meetings" },
    { value: "planning", label: "Planning" },
    { value: "engineering", label: "Engineering" },
    { value: "design", label: "Design" },
    { value: "other", label: "Other" },
  ];

  // Group templates by built-in vs custom
  const builtInTemplates = templates?.filter((t) => t.isBuiltIn) || [];
  const customTemplates = templates?.filter((t) => !t.isBuiltIn) || [];

  return (
    <>
      <Card>
        <CardHeader
          title="Document Templates"
          description="Create documents from pre-built templates"
          action={
            <Button
              onClick={() => setShowModal(true)}
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
          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.value
                      ? "bg-brand-600 text-white"
                      : "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {!templates || templates.length === 0 ? (
            <EmptyState
              icon="📄"
              title="No templates yet"
              description="Create templates to speed up document creation"
              action={{
                label: "Create Your First Template",
                onClick: () => setShowModal(true),
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Built-in Templates */}
              {builtInTemplates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
                    Built-in Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {builtInTemplates.map((template) => (
                      <button
                        key={template._id}
                        type="button"
                        onClick={() => onSelectTemplate?.(template._id)}
                        className="p-4 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-900/40 rounded-lg hover:shadow-md transition-all text-left border-2 border-transparent hover:border-brand-300 dark:hover:border-brand-700"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{template.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                              {template.name}
                            </h4>
                            {template.description && (
                              <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark line-clamp-2">
                                {template.description}
                              </p>
                            )}
                            <span className="inline-block mt-2 text-xs px-2 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded capitalize">
                              {template.category}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Templates */}
              {customTemplates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
                    Custom Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customTemplates.map((template) => (
                      <div
                        key={template._id}
                        className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark transition-colors border border-ui-border-primary dark:border-ui-border-primary-dark"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => onSelectTemplate?.(template._id)}
                            className="flex items-start gap-3 flex-1 text-left"
                          >
                            <span className="text-2xl">{template.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                                {template.name}
                              </h4>
                              {template.description && (
                                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark line-clamp-2 mb-2">
                                  {template.description}
                                </p>
                              )}
                              <div className="flex gap-2">
                                <span className="text-xs px-2 py-1 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded capitalize">
                                  {template.category}
                                </span>
                                {template.isPublic && (
                                  <span className="text-xs px-2 py-1 bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark rounded">
                                    Public
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(template)}
                              leftIcon={
                                <svg
                                  aria-hidden="true"
                                  className="w-3 h-3"
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
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(template._id)}
                              leftIcon={
                                <svg
                                  aria-hidden="true"
                                  className="w-3 h-3"
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
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingId ? "Edit Template" : "Create Template"}
        maxWidth="2xl"
        fullScreenOnMobile={true}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Template Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekly Sprint Review"
              required
              autoFocus
            />

            <InputField
              label="Icon (Emoji)"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📄"
              maxLength={2}
              required
            />
          </div>

          <TextareaField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this template is for..."
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="meeting">Meeting</option>
              <option value="planning">Planning</option>
              <option value="engineering">Engineering</option>
              <option value="design">Design</option>
              <option value="other">Other</option>
            </SelectField>

            <div className="flex items-center gap-2 pt-7">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-brand-600 bg-ui-bg-primary border-ui-border-primary rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-ui-bg-primary-dark focus:ring-2 dark:bg-ui-bg-primary-dark dark:border-ui-border-primary-dark"
              />
              <label
                htmlFor="isPublic"
                className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark"
              >
                Make public (visible to all users)
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" isLoading={isSubmitting}>
              {editingId ? "Update" : "Create"} Template
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
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}
