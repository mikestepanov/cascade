import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { InputField } from "./ui/InputField";
import { Modal } from "./ui/Modal";

interface CreateProjectFromTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: Id<"projects">) => void;
}

export function CreateProjectFromTemplate({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectFromTemplateProps) {
  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"projectTemplates"> | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [description, setDescription] = useState("");

  const templates = useQuery(api.projectTemplates.list);
  const selectedTemplate = selectedTemplateId
    ? useQuery(api.projectTemplates.get, { id: selectedTemplateId })
    : null;
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
    if (!selectedTemplateId || !projectName.trim() || !projectKey.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const projectId = await createProject({
        templateId: selectedTemplateId,
        projectName: projectName.trim(),
        projectKey: projectKey.trim().toUpperCase(),
        description: description.trim() || undefined,
      });

      toast.success("Project created successfully");
      onProjectCreated?.(projectId);
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    }
  };

  const resetForm = () => {
    setStep("select");
    setSelectedTemplateId(null);
    setProjectName("");
    setProjectKey("");
    setDescription("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "software":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "marketing":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "design":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "select" ? "Choose a Template" : "Configure Project"}
      size="large"
    >
      {step === "select" ? (
        // Template Selection
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Start with a pre-configured template to save time and follow best practices
          </p>

          {!templates ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template._id}
                  onClick={() => handleSelectTemplate(template._id)}
                  className="text-left p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${getCategoryColor(template.category)}`}
                        >
                          {template.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">
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
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTemplate.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTemplate.workflowStates.length} workflow states,{" "}
                    {selectedTemplate.defaultLabels.length} default labels
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <InputField
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
              required
            />

            <InputField
              label="Project Key"
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
              placeholder="MAP"
              required
              helperText="Short code for issue keys (e.g., MAP-123)"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
                placeholder="Project description..."
              />
            </div>
          </div>

          {/* Preview */}
          {selectedTemplate && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What's Included:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedTemplate.workflowStates.length} workflow states
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedTemplate.defaultLabels.length} pre-configured labels
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {selectedTemplate.boardType} board type
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button onClick={handleBack} variant="secondary">
              ← Back to Templates
            </Button>
            <div className="flex gap-3">
              <Button onClick={handleClose} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!projectName.trim() || !projectKey.trim()}>
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
