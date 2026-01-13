import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { z } from "zod";
import { FormInput, FormSelect, FormTextarea, useAppForm } from "@/lib/form";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";

// =============================================================================
// Schema
// =============================================================================

const issueTypes = ["task", "bug", "story", "epic"] as const;
const priorities = ["lowest", "low", "medium", "high", "highest"] as const;

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(issueTypes),
  titleTemplate: z.string().min(1, "Title template is required"),
  descriptionTemplate: z.string().optional(),
  defaultPriority: z.enum(priorities),
  defaultLabels: z.string().optional(),
});

// =============================================================================
// Component
// =============================================================================

interface TemplateFormProps {
  projectId: Id<"projects">;
  template?: {
    _id: Id<"issueTemplates">;
    name: string;
    type: "task" | "bug" | "story" | "epic";
    titleTemplate: string;
    descriptionTemplate: string;
    defaultPriority: "lowest" | "low" | "medium" | "high" | "highest";
    defaultLabels?: string[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateForm({ projectId, template, open, onOpenChange }: TemplateFormProps) {
  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);

  const form = useAppForm({
    defaultValues: {
      name: "",
      type: "task" as const,
      titleTemplate: "",
      descriptionTemplate: "",
      defaultPriority: "medium" as const,
      defaultLabels: "",
    },
    validators: { onChange: templateSchema },
    onSubmit: async ({ value }: { value: any }) => {
      try {
        const templateData = {
          name: value.name.trim(),
          type: value.type,
          titleTemplate: value.titleTemplate.trim(),
          descriptionTemplate: value.descriptionTemplate?.trim() || "",
          defaultPriority: value.defaultPriority,
          defaultLabels:
            value.defaultLabels
              ?.split(",")
              .map((l: string) => l.trim())
              .filter(Boolean) || [],
        };

        if (template) {
          await updateTemplate({ id: template._id, ...templateData });
          showSuccess("Template updated");
        } else {
          await createTemplate({ projectId, ...templateData });
          showSuccess("Template created");
        }
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to save template");
      }
    },
  });

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      form.setFieldValue("name", template.name);
      form.setFieldValue("type", template.type);
      form.setFieldValue("titleTemplate", template.titleTemplate);
      form.setFieldValue("descriptionTemplate", template.descriptionTemplate);
      form.setFieldValue("defaultPriority", template.defaultPriority);
      form.setFieldValue("defaultLabels", template.defaultLabels?.join(", ") || "");
    } else {
      form.reset();
    }
  }, [template, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field name="name">
              {(field) => (
                <FormInput
                  field={field}
                  label="Template Name"
                  placeholder="e.g., Bug Report, Feature Request"
                  required
                  autoFocus
                />
              )}
            </form.Field>

            <form.Field name="type">
              {(field) => (
                <FormSelect field={field} label="Issue Type" required>
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="story">Story</option>
                  <option value="epic">Epic</option>
                </FormSelect>
              )}
            </form.Field>
          </div>

          <form.Field name="titleTemplate">
            {(field) => (
              <FormInput
                field={field}
                label="Title Template"
                placeholder="e.g., [BUG] {description}"
                helperText="Use {placeholders} for dynamic content"
                required
              />
            )}
          </form.Field>

          <form.Field name="descriptionTemplate">
            {(field) => (
              <FormTextarea
                field={field}
                label="Description Template"
                placeholder="## Steps to Reproduce&#10;1. &#10;2. &#10;&#10;## Expected Result&#10;&#10;## Actual Result"
                rows={6}
                className="font-mono text-sm"
              />
            )}
          </form.Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field name="defaultPriority">
              {(field) => (
                <FormSelect field={field} label="Default Priority">
                  <option value="lowest">Lowest</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="highest">Highest</option>
                </FormSelect>
              )}
            </form.Field>

            <form.Field name="defaultLabels">
              {(field) => (
                <FormInput
                  field={field}
                  label="Default Labels (comma separated)"
                  placeholder="bug, frontend, urgent"
                />
              )}
            </form.Field>
          </div>

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
                    {template ? "Update" : "Create"} Template
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
