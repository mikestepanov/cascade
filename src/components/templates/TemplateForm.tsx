import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Input, Select, Textarea } from "../ui/form";

type IssueType = "task" | "bug" | "story" | "epic";
type IssuePriority = "lowest" | "low" | "medium" | "high" | "highest";

interface TemplateFormProps {
  projectId: Id<"projects">;
  template?: {
    _id: Id<"issueTemplates">;
    name: string;
    type: IssueType;
    titleTemplate: string;
    descriptionTemplate: string;
    defaultPriority: IssuePriority;
    defaultLabels?: string[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Form component for creating/editing issue templates
 * Extracted from TemplatesManager for better reusability
 */
export function TemplateForm({ projectId, template, open, onOpenChange }: TemplateFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<IssueType>("task");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [descriptionTemplate, setDescriptionTemplate] = useState("");
  const [defaultPriority, setDefaultPriority] = useState<IssuePriority>("medium");
  const [defaultLabels, setDefaultLabels] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);

  // Reset form when template changes or dialog opens
  useEffect(() => {
    if (template) {
      setName(template.name);
      setType(template.type);
      setTitleTemplate(template.titleTemplate);
      setDescriptionTemplate(template.descriptionTemplate);
      setDefaultPriority(template.defaultPriority);
      setDefaultLabels(template.defaultLabels?.join(", ") || "");
    } else {
      setName("");
      setType("task");
      setTitleTemplate("");
      setDescriptionTemplate("");
      setDefaultPriority("medium");
      setDefaultLabels("");
    }
    setIsSubmitting(false);
  }, [template]);

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

      if (template) {
        await updateTemplate({ id: template._id, ...templateData });
        toast.success("Template updated");
      } else {
        await createTemplate({ projectId, ...templateData });
        toast.success("Template created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Template Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bug Report, Feature Request"
              required
              autoFocus
            />

            <Select
              label="Issue Type"
              value={type}
              onChange={(e) => setType(e.target.value as IssueType)}
              required
            >
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="story">Story</option>
              <option value="epic">Epic</option>
            </Select>
          </div>

          <Input
            label="Title Template"
            value={titleTemplate}
            onChange={(e) => setTitleTemplate(e.target.value)}
            placeholder="e.g., [BUG] {description}"
            helpText="Use {placeholders} for dynamic content"
            required
          />

          <Textarea
            label="Description Template"
            value={descriptionTemplate}
            onChange={(e) => setDescriptionTemplate(e.target.value)}
            placeholder="## Steps to Reproduce&#10;1. &#10;2. &#10;&#10;## Expected Result&#10;&#10;## Actual Result"
            rows={6}
            className="font-mono text-sm"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default Priority"
              value={defaultPriority}
              onChange={(e) => setDefaultPriority(e.target.value as IssuePriority)}
            >
              <option value="lowest">Lowest</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="highest">Highest</option>
            </Select>

            <Input
              label="Default Labels (comma separated)"
              value={defaultLabels}
              onChange={(e) => setDefaultLabels(e.target.value)}
              placeholder="bug, frontend, urgent"
            />
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
