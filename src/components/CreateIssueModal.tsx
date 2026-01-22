import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toggleInArray } from "@/lib/array-utils";
import { FormInput, FormSelect, FormTextarea } from "@/lib/form";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Select } from "./ui/form";

// =============================================================================
// Schema
// =============================================================================

const issueTypes = ["task", "bug", "story", "epic", "subtask"] as const;
const priorities = ["lowest", "low", "medium", "high", "highest"] as const;

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  type: z.enum(issueTypes),
  priority: z.enum(priorities),
  assigneeId: z.string(),
  storyPoints: z.string(),
});

// =============================================================================
// Component
// =============================================================================

interface CreateIssueModalProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Render a modal dialog that lets users create a new issue for a project.
 *
 * The modal provides optional template selection, title/description inputs, type/priority selectors,
 * assignee and story point fields, label selection, and an AI-powered suggestions action. It handles
 * applying templates, toggling label selection, generating and applying AI suggestions, and creating
 * the issue via the provided project and sprint context.
 *
 * @param projectId - The id of the project the new issue will belong to.
 * @param sprintId - Optional id of the sprint to associate the new issue with.
 * @param open - Whether the modal is open.
 * @param onOpenChange - Callback invoked when the modal open state changes; receives the new open state.
 * @returns The modal's JSX element, or `null` when required project data is not yet available.
 */
export function CreateIssueModal({
  projectId,
  sprintId,
  open,
  onOpenChange,
}: CreateIssueModalProps) {
  // Template selection (outside form - controls form reset)
  const [selectedTemplate, setSelectedTemplate] = useState<Id<"issueTemplates"> | "">("");
  // Labels (array state, not simple string)
  const [selectedLabels, setSelectedLabels] = useState<Id<"labels">[]>([]);
  // AI state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Queries
  const project = useQuery(api.projects.getProject, { id: projectId });
  const templates = useQuery(api.templates.listByProject, { projectId });
  const labels = useQuery(api.labels.list, { projectId });

  // Mutations
  const createIssue = useMutation(api.issues.create);
  const generateSuggestions = useAction(api.ai.actions.generateIssueSuggestions);

  type CreateIssueForm = z.infer<typeof createIssueSchema>;

  // Form
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      type: "task" as CreateIssueForm["type"],
      priority: "medium" as CreateIssueForm["priority"],
      assigneeId: "",
      storyPoints: "",
    },
    validators: { onChange: createIssueSchema },
    onSubmit: async ({ value }: { value: CreateIssueForm }) => {
      try {
        await createIssue({
          projectId,
          title: value.title.trim(),
          description: value.description?.trim() || undefined,
          type: value.type,
          priority: value.priority,
          assigneeId: (value.assigneeId || undefined) as Id<"users"> | undefined,
          sprintId,
          labels: selectedLabels.length > 0 ? selectedLabels : undefined,
          storyPoints: value.storyPoints ? Number.parseFloat(value.storyPoints) : undefined,
        });

        showSuccess("Issue created successfully");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to create issue");
      }
    },
  });

  // Apply template when selected
  useEffect(() => {
    if (!(selectedTemplate && templates)) return;

    const template = templates.find((t: Doc<"issueTemplates">) => t._id === selectedTemplate);
    if (!template) return;

    form.setFieldValue("type", template.type);
    form.setFieldValue("priority", template.defaultPriority);
    form.setFieldValue("title", template.titleTemplate);
    form.setFieldValue("description", template.descriptionTemplate || "");

    // Apply default labels if they exist
    if (template.defaultLabels && template.defaultLabels.length > 0 && labels) {
      const labelIds = labels
        .filter((label: Doc<"labels">) => template.defaultLabels?.includes(label.name))
        .map((label: Doc<"labels">) => label._id);
      setSelectedLabels(labelIds);
    }
  }, [selectedTemplate, templates, labels, form]);

  const toggleLabel = (labelId: Id<"labels">) => {
    setSelectedLabels((prev) => toggleInArray(prev, labelId));
  };

  const handleGenerateAISuggestions = async () => {
    const title = form.getFieldValue("title") as string;
    const description = form.getFieldValue("description");

    if (!title?.trim()) {
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
      if (suggestions.description && !(description as string)?.trim()) {
        form.setFieldValue("description", suggestions.description);
      }

      if (suggestions.priority) {
        form.setFieldValue("priority", suggestions.priority as (typeof priorities)[number]);
      }

      if (suggestions.labels && (suggestions.labels as string[]).length > 0 && labels) {
        const suggestedLabelIds = labels
          .filter((label: Doc<"labels">) => (suggestions.labels as string[]).includes(label.name))
          .map((label: Doc<"labels">) => label._id);
        setSelectedLabels((prev) => [...new Set([...prev, ...suggestedLabelIds])]);
      }

      setShowAISuggestions(true);
      showSuccess("AI suggestions applied!");
    } catch (error) {
      showError(error, "Failed to generate AI suggestions. Make sure AI provider is configured.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
          <DialogDescription className="sr-only">Form to create a new issue</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Template Selector (outside form state) */}
          {templates && templates.length > 0 && (
            <Select
              label="Use Template (Optional)"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as Id<"issueTemplates"> | "")}
            >
              <option value="">Start from scratch</option>
              {templates.map((template: Doc<"issueTemplates">) => (
                <option key={template._id} value={template._id}>
                  {template.name} ({template.type})
                </option>
              ))}
            </Select>
          )}

          {/* Title */}
          <form.Field name="title">
            {(field) => (
              <FormInput field={field} label="Title" placeholder="Enter issue title..." required />
            )}
          </form.Field>

          {/* AI Suggestions Button */}
          <Flex align="center" gap="sm" className="pb-2">
            <button
              type="button"
              onClick={handleGenerateAISuggestions}
              disabled={isGeneratingAI}
              className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-brand-600 to-accent-600 text-white text-sm font-medium rounded-lg hover:from-brand-700 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              <Flex
                align="center"
                gap="xs"
                className="text-sm text-status-success dark:text-status-success"
                aria-live="polite"
              >
                <span>✓</span>
                <span>AI suggestions applied</span>
              </Flex>
            )}
          </Flex>

          {/* Description */}
          <form.Field name="description">
            {(field) => (
              <FormTextarea
                field={field}
                label="Description"
                placeholder="Enter issue description..."
                rows={6}
              />
            )}
          </form.Field>

          {/* Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field name="type">
              {(field) => (
                <FormSelect field={field} label="Type">
                  <option value="task">📋 Task</option>
                  <option value="bug">🐛 Bug</option>
                  <option value="story">📖 Story</option>
                  <option value="epic">🎯 Epic</option>
                  <option value="subtask">🔸 Sub-task</option>
                </FormSelect>
              )}
            </form.Field>

            <form.Field name="priority">
              {(field) => (
                <FormSelect field={field} label="Priority">
                  <option value="lowest">⬇️ Lowest</option>
                  <option value="low">↘️ Low</option>
                  <option value="medium">➡️ Medium</option>
                  <option value="high">↗️ High</option>
                  <option value="highest">⬆️ Highest</option>
                </FormSelect>
              )}
            </form.Field>
          </div>

          {/* Assignee */}
          <form.Field name="assigneeId">
            {(field) => (
              <FormSelect field={field} label="Assignee">
                <option value="">Unassigned</option>
                {project.members.map((member: Doc<"users">) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </FormSelect>
            )}
          </form.Field>

          {/* Story Points */}
          <form.Field name="storyPoints">
            {(field) => (
              <FormInput
                field={field}
                label="Story Points"
                type="number"
                placeholder="Enter story points (optional)"
                min="0"
                step="0.5"
              />
            )}
          </form.Field>

          {/* Labels (outside form - array state) */}
          {labels && labels.length > 0 && (
            <div>
              <div className="block text-sm font-medium text-ui-text-primary mb-2">Labels</div>
              <Flex wrap gap="sm">
                {labels.map((label: Doc<"labels">) => (
                  <button
                    key={label._id}
                    type="button"
                    onClick={() => toggleLabel(label._id)}
                    aria-pressed={selectedLabels.includes(label._id)}
                    className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white transition-opacity",
                      selectedLabels.includes(label._id)
                        ? "opacity-100 ring-2 ring-offset-2 ring-brand-600 dark:ring-brand-500"
                        : "opacity-60 hover:opacity-80",
                    )}
                    style={{ backgroundColor: label.color }}
                  >
                    {selectedLabels.includes(label._id) && <span className="mr-1">✓</span>}
                    {label.name}
                  </button>
                ))}
              </Flex>
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    Create Issue
                  </Button>
                </>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
