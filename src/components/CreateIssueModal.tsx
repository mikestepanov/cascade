import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { toggleInArray } from "@/lib/array-utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { InputField, SelectField, TextareaField } from "./ui/FormField";
import { Modal } from "./ui/Modal";

interface CreateIssueModalProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  onClose: () => void;
}

export function CreateIssueModal({ projectId, sprintId, onClose }: CreateIssueModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Id<"issueTemplates"> | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"task" | "bug" | "story" | "epic">("task");
  const [priority, setPriority] = useState<"lowest" | "low" | "medium" | "high" | "highest">(
    "medium",
  );
  const [assigneeId, setAssigneeId] = useState<Id<"users"> | "">("");
  const [selectedLabels, setSelectedLabels] = useState<Id<"labels">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const project = useQuery(api.projects.get, { id: projectId });
  const templates = useQuery(api.templates.list, { projectId });
  const labels = useQuery(api.labels.list, { projectId });
  const createIssue = useMutation(api.issues.create);

  // Apply template when selected
  useEffect(() => {
    if (!selectedTemplate || !templates) return;

    const template = templates.find((t) => t._id === selectedTemplate);
    if (!template) return;

    setType(template.type);
    setPriority(template.defaultPriority);

    // Apply title template (simple implementation - replace {description} placeholder)
    setTitle(template.titleTemplate);

    // Apply description template
    setDescription(template.descriptionTemplate || "");

    // Apply default labels if they exist
    if (template.defaultLabels && template.defaultLabels.length > 0 && labels) {
      const labelIds = labels
        .filter((label) => template.defaultLabels?.includes(label.name))
        .map((label) => label._id);
      setSelectedLabels(labelIds);
    }
  }, [selectedTemplate, templates, labels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createIssue({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        assigneeId: assigneeId || undefined,
        sprintId,
        labels: selectedLabels.length > 0 ? selectedLabels : undefined,
      });

      showSuccess("Issue created successfully");
      onClose();
    } catch (error) {
      showError(error, "Failed to create issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLabel = (labelId: Id<"labels">) => {
    setSelectedLabels((prev) => toggleInArray(prev, labelId));
  };

  if (!project) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create Issue"
      maxWidth="2xl"
      fullScreenOnMobile={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        {/* Template Selector */}
        {templates && templates.length > 0 && (
          <SelectField
            label="Use Template (Optional)"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as Id<"issueTemplates"> | "")}
          >
            <option value="">Start from scratch</option>
            {templates.map((template) => (
              <option key={template._id} value={template._id}>
                {template.name} ({template.type})
              </option>
            ))}
          </SelectField>
        )}

        <InputField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter issue title..."
          required
          autoFocus={!selectedTemplate}
        />

        <TextareaField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter issue description..."
          rows={6}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as "task" | "bug" | "story" | "epic")}
          >
            <option value="task">📋 Task</option>
            <option value="bug">🐛 Bug</option>
            <option value="story">📖 Story</option>
            <option value="epic">🎯 Epic</option>
          </SelectField>

          <SelectField
            label="Priority"
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "lowest" | "low" | "medium" | "high" | "highest")
            }
          >
            <option value="lowest">⬇️ Lowest</option>
            <option value="low">↘️ Low</option>
            <option value="medium">➡️ Medium</option>
            <option value="high">↗️ High</option>
            <option value="highest">⬆️ Highest</option>
          </SelectField>
        </div>

        <SelectField
          label="Assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value as Id<"users"> | "")}
        >
          <option value="">Unassigned</option>
          {project.members.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name}
            </option>
          ))}
        </SelectField>

        {/* Labels */}
        {labels && labels.length > 0 && (
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">Labels</div>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label._id}
                  type="button"
                  onClick={() => toggleLabel(label._id)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white transition-opacity ${
                    selectedLabels.includes(label._id)
                      ? "opacity-100 ring-2 ring-offset-2 ring-gray-900"
                      : "opacity-60 hover:opacity-80"
                  }`}
                  style={{ backgroundColor: label.color }}
                >
                  {selectedLabels.includes(label._id) && <span className="mr-1">✓</span>}
                  {label.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isSubmitting}>
            Create Issue
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
