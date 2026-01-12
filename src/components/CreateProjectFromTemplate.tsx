import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCompany } from "../hooks/useCompanyContext";
import { Button } from "./ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Input, Select, Textarea } from "./ui/form";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Typography } from "./ui/Typography";
import { cn } from "@/lib/utils";

interface CreateProjectFromTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (projectId: Id<"projects">, projectKey: string) => void;
}

export function CreateProjectFromTemplate({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectFromTemplateProps) {
  const { companyId } = useCompany();
  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"projectTemplates"> | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<Id<"workspaces"> | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const workspaces = useQuery(api.workspaces.list, { companyId });

  const templates = useQuery(api.projectTemplates.list);
  const selectedTemplate = useQuery(
    api.projectTemplates.get,
    selectedTemplateId ? { id: selectedTemplateId } : "skip",
  );

  // Auto-select first workspace if available
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0]._id);
    }
  }, [workspaces, selectedWorkspaceId]);

  const createProject = useMutation(api.projectTemplates.createFromTemplate);

  const handleSelectTemplate = (templateId: Id<"projectTemplates">) => {
    setSelectedTemplateId(templateId);
    setStep("configure");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedTemplateId(null);
  };

  const handleCreate = async () => {
    if (!(selectedTemplateId && selectedWorkspaceId && projectName.trim() && projectKey.trim())) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const projectId = await createProject({
        templateId: selectedTemplateId,
        projectName: projectName.trim(),
        projectKey: projectKey.trim().toUpperCase(),
        description: description.trim() || undefined,
        companyId,
        workspaceId: selectedWorkspaceId,
      });

      toast.success("Project created successfully");
      onProjectCreated?.(projectId, projectKey.trim().toUpperCase());
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep("select");
    setSelectedTemplateId(null);
    setProjectName("");
    setProjectKey("");
    setDescription("");
    setIsSubmitting(false); // Reset submitting state too
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "software":
        return "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200";
      case "marketing":
        return "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200";
      case "design":
        return "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200";
      default:
        return "bg-ui-bg-tertiary text-ui-text-secondary dark:bg-ui-bg-tertiary-dark dark:text-ui-text-secondary-dark";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl" data-testid="create-project-modal">
        <DialogHeader>
          <DialogTitle>{step === "select" ? "Choose a Template" : "Configure Project"}</DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          // Template Selection
          <div className="space-y-6">
            <Typography variant="p" color="secondary">
              Start with a pre-configured template to save time and follow best practices
            </Typography>

            {!templates ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <button
                    type="button"
                    key={template._id}
                    onClick={() => handleSelectTemplate(template._id)}
                    className="text-left p-6 border-2 border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg hover:border-brand-500 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl flex-shrink-0">{template.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                          {template.name}
                        </h3>
                        <Typography variant="p" color="secondary" className="text-sm mb-3">
                          {template.description}
                        </Typography>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded",
                              getCategoryColor(template.category),
                            )}
                          >
                            {template.category}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark capitalize">
                            {template.boardType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Project Configuration
          <div className="space-y-6">
            {/* Template Info */}
            {selectedTemplate && (
              <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedTemplate.icon}</span>
                  <div>
                    <h3 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                      {selectedTemplate.name}
                    </h3>
                    <Typography variant="p" color="secondary" className="text-sm">
                      {selectedTemplate.workflowStates.length} workflow states,{" "}
                      {selectedTemplate.defaultLabels.length} default labels
                    </Typography>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              {workspaces && workspaces.length > 1 && (
                <Select
                  label="Workspace"
                  value={selectedWorkspaceId || ""}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value as Id<"workspaces">)}
                  options={workspaces.map((ws) => ({ value: ws._id, label: ws.name }))}
                  required
                />
              )}

              <Input
                label="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Project"
                required
              />

              <Input
                label="Project Key"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                placeholder="MAP"
                required
                helperText="Short code for issue keys (e.g., MAP-123)"
              />

              <Textarea
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Project description..."
              />
            </div>

            {/* Preview */}
            {selectedTemplate && (
              <div>
                <h4 className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
                  What's Included:
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-status-success"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-ui-text-primary dark:text-ui-text-primary-dark">
                      {selectedTemplate.workflowStates.length} workflow states
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-status-success"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-ui-text-primary dark:text-ui-text-primary-dark">
                      {selectedTemplate.defaultLabels.length} pre-configured labels
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-status-success"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-ui-text-primary dark:text-ui-text-primary-dark capitalize">
                      {selectedTemplate.boardType} board type
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-3">
              <Button
                onClick={handleBack}
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                ← Back to Templates
              </Button>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleClose}
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    !(projectName.trim() && projectKey.trim() && selectedWorkspaceId) ||
                    isSubmitting
                  }
                  className="flex-1 sm:flex-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
