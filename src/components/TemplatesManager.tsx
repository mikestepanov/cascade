import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";
import { InputField, SelectField, TextareaField } from "./ui/FormField";
import { Modal } from "./ui/Modal";

interface TemplatesManagerProps {
  projectId: Id<"projects">;
}

type IssueType = "task" | "bug" | "story" | "epic";
type IssuePriority = "lowest" | "low" | "medium" | "high" | "highest";

export function TemplatesManager({ projectId }: TemplatesManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<Id<"issueTemplates"> | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<IssueType>("task");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [descriptionTemplate, setDescriptionTemplate] = useState("");
  const [defaultPriority, setDefaultPriority] = useState<IssuePriority>("medium");
  const [defaultLabels, setDefaultLabels] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"issueTemplates"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templates = useQuery(api.templates.list, { projectId });
  const _labels = useQuery(api.labels.list, { projectId });
  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);
  const deleteTemplate = useMutation(api.templates.remove);

  const resetForm = () => {
    setName("");
    setType("task");
    setTitleTemplate("");
    setDescriptionTemplate("");
    setDefaultPriority("medium");
    setDefaultLabels("");
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
        type,
        titleTemplate: titleTemplate.trim(),
        descriptionTemplate: descriptionTemplate.trim(),
        defaultPriority,
        defaultLabels: defaultLabels
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await updateTemplate({ id: editingId, ...templateData });
        toast.success("Template updated");
      } else {
        await createTemplate({ projectId, ...templateData });
        toast.success("Template created");
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (template: {
    _id: Id<"issueTemplates">;
    name: string;
    type: "task" | "bug" | "story" | "epic";
    titleTemplate: string;
    descriptionTemplate: string;
    defaultPriority: "lowest" | "low" | "medium" | "high" | "highest";
    defaultLabels?: string[];
  }) => {
    setEditingId(template._id);
    setName(template.name);
    setType(template.type);
    setTitleTemplate(template.titleTemplate);
    setDescriptionTemplate(template.descriptionTemplate);
    setDefaultPriority(template.defaultPriority);
    setDefaultLabels(template.defaultLabels?.join(", ") || "");
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

  const getTypeIcon = (type: IssueType) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "story":
        return "📖";
      case "epic":
        return "⚡";
      default:
        return "✓";
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Issue Templates"
          description="Create reusable templates for common issue types"
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
          {!templates || templates.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No templates yet"
              description="Create templates to speed up issue creation"
              action={{
                label: "Create Your First Template",
                onClick: () => setShowModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template._id}
                  className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getTypeIcon(template.type)}</span>
                        <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">{template.name}</h4>
                        <span className="text-xs px-2 py-0.5 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark rounded capitalize">
                          {template.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 rounded capitalize">
                          {template.defaultPriority}
                        </span>
                      </div>
                      <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-1">
                        <span className="font-medium">Title:</span> {template.titleTemplate}
                      </p>
                      {template.descriptionTemplate && (
                        <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark line-clamp-2">
                          {template.descriptionTemplate}
                        </p>
                      )}
                      {template.defaultLabels && template.defaultLabels.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {template.defaultLabels.map((label) => (
                            <span
                              key={label}
                              className="text-xs px-2 py-0.5 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(template)}
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
                        onClick={() => setDeleteConfirm(template._id)}
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
                    </div>
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
              placeholder="e.g., Bug Report, Feature Request"
              required
              autoFocus
            />

            <SelectField
              label="Issue Type"
              value={type}
              onChange={(e) => setType(e.target.value as IssueType)}
              required
            >
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="story">Story</option>
              <option value="epic">Epic</option>
            </SelectField>
          </div>

          <InputField
            label="Title Template"
            value={titleTemplate}
            onChange={(e) => setTitleTemplate(e.target.value)}
            placeholder="e.g., [BUG] {description}"
            helpText="Use {placeholders} for dynamic content"
            required
          />

          <TextareaField
            label="Description Template"
            value={descriptionTemplate}
            onChange={(e) => setDescriptionTemplate(e.target.value)}
            placeholder="## Steps to Reproduce&#10;1. &#10;2. &#10;&#10;## Expected Result&#10;&#10;## Actual Result"
            rows={6}
            className="font-mono text-sm"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Default Priority"
              value={defaultPriority}
              onChange={(e) => setDefaultPriority(e.target.value as IssuePriority)}
            >
              <option value="lowest">Lowest</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="highest">Highest</option>
            </SelectField>

            <InputField
              label="Default Labels (comma separated)"
              value={defaultLabels}
              onChange={(e) => setDefaultLabels(e.target.value)}
              placeholder="bug, frontend, urgent"
            />
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
        message="Are you sure you want to delete this template?"
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}
