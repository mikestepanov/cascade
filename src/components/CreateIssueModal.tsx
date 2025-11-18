import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toggleInArray } from "@/lib/array-utils";
import { showError, showSuccess } from "@/lib/toast";
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
  const [type, setType] = useState<"task" | "bug" | "story" | "epic" | "subtask">("task");
  const [priority, setPriority] = useState<"lowest" | "low" | "medium" | "high" | "highest">(
    "medium",
  );
  const [assigneeId, setAssigneeId] = useState<Id<"users"> | "">("");
  const [selectedLabels, setSelectedLabels] = useState<Id<"labels">[]>([]);
  const [storyPoints, setStoryPoints] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const project = useQuery(api.projects.get, { id: projectId });
  const templates = useQuery(api.templates.list, { projectId });
  const labels = useQuery(api.labels.list, { projectId });
  const createIssue = useMutation(api.issues.create);
  const generateSuggestions = useAction(api.ai.actions.generateIssueSuggestions);

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
        storyPoints: storyPoints ? Number.parseFloat(storyPoints) : undefined,
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

  const handleGenerateAISuggestions = async () => {
    if (!title.trim()) {
      showError(new Error("Please enter a title first"), "Title required");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const suggestions = await generateSuggestions({
        projectId,
        issueTitle: title,
        issueDescription: description || undefined,
        suggestionTypes: ["description", "priority", "labels"],
      });

      // Apply AI suggestions
      if (suggestions.description && !description.trim()) {
        setDescription(suggestions.description);
      }

      if (suggestions.priority) {
        setPriority(suggestions.priority as "lowest" | "low" | "medium" | "high" | "highest");
      }

      if (suggestions.labels && Array.isArray(suggestions.labels) && labels) {
        const suggestedLabelIds = labels
          .filter((label) => suggestions.labels.includes(label.name))
          .map((label) => label._id);
        setSelectedLabels((prev) => [...new Set([...prev, ...suggestedLabelIds])]);
      }

      setShowAISuggestions(true);
      showSuccess("AI suggestions applied!");
    } catch (error) {
      console.error("AI suggestion error:", error);
      showError(error, "Failed to generate AI suggestions. Make sure AI provider is configured.");
    } finally {
      setIsGeneratingAI(false);
    }
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
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
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
        />

        {/* AI Suggestions Button */}
        <div className="flex items-center gap-2 pb-2">
          <button
            type="button"
            onClick={handleGenerateAISuggestions}
            disabled={!title.trim() || isGeneratingAI}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGeneratingAI ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Get AI Suggestions</span>
              </>
            )}
          </button>
          {showAISuggestions && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <span>✓</span>
              <span>AI suggestions applied</span>
            </span>
          )}
        </div>

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
            onChange={(e) =>
              setType(e.target.value as "task" | "bug" | "story" | "epic" | "subtask")
            }
          >
            <option value="task">📋 Task</option>
            <option value="bug">🐛 Bug</option>
            <option value="story">📖 Story</option>
            <option value="epic">🎯 Epic</option>
            <option value="subtask">🔸 Sub-task</option>
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

        <InputField
          label="Story Points"
          type="number"
          value={storyPoints}
          onChange={(e) => setStoryPoints(e.target.value)}
          placeholder="Enter story points (optional)"
          min="0"
          step="0.5"
        />

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
