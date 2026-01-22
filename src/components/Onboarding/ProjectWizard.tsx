import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Textarea } from "../ui/form";
import { Progress } from "../ui/progress";
import { Typography } from "../ui/Typography";

interface ProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (projectId: string) => void;
  organizationId: Id<"organizations">;
  workspaceId: Id<"workspaces">;
}

export function ProjectWizard({
  open,
  onOpenChange,
  onComplete,
  organizationId,
  workspaceId,
}: ProjectWizardProps) {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [description, setDescription] = useState("");
  const [boardType, setBoardType] = useState<"kanban" | "scrum">("kanban");
  const [workflowStates, setWorkflowStates] = useState([
    { id: "todo", name: "To Do", category: "todo" as const, order: 0 },
    { id: "inprogress", name: "In Progress", category: "inprogress" as const, order: 1 },
    { id: "done", name: "Done", category: "done" as const, order: 2 },
  ]);

  const createWorkspace = useMutation(api.projects.createProject);
  const updateOnboarding = useMutation(api.onboarding.updateOnboardingStatus);

  const handleNext = () => {
    if (step === 1) {
      if (!projectName.trim()) {
        showError("Project name is required");
        return;
      }
      if (!projectKey.trim()) {
        showError("Project key is required");
        return;
      }
      if (projectKey.length < 2 || projectKey.length > 10) {
        showError("Project key must be 2-10 characters");
        return;
      }
      if (!/^[A-Z]+$/.test(projectKey)) {
        showError("Project key must be uppercase letters only");
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleFinish = async () => {
    try {
      const projectId = await createWorkspace({
        name: projectName,
        key: projectKey,
        description: description || undefined,
        isPublic: false,
        boardType,
        workflowStates,
        organizationId,
        workspaceId,
      });

      // Update onboarding status
      await updateOnboarding({
        wizardCompleted: true,
        onboardingStep: 3,
      });

      // Confetti effect (optional - would need react-confetti package)
      showSuccess("🎉 Project created successfully!");

      onComplete(projectId);
    } catch (error) {
      showError(error, "Failed to create project");
    }
  };

  const generateKeyFromName = (name: string) => {
    const key = name
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 10);
    setProjectKey(key);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="mb-6">
            <Flex justify="between" className="mb-2">
              <span className="text-sm font-medium text-ui-text-primary">Step {step} of 4</span>
              <span className="text-sm text-ui-text-tertiary">
                {Math.round((step / 4) * 100)}% complete
              </span>
            </Flex>
            <Progress value={(step / 4) * 100} />
          </div>

          {/* Step 1: Project Name & Key */}
          {step === 1 && (
            <div className="space-y-4">
              <Typography variant="h2" className="text-2xl font-bold text-ui-text-primary">
                Create Your First Project
              </Typography>
              <Typography className="text-ui-text-secondary">
                Let's start by giving your project a name and a unique key.
              </Typography>

              <div>
                <label
                  htmlFor="project-name"
                  className="block text-sm font-medium text-ui-text-primary mb-1"
                >
                  Project Name <span className="text-status-error">*</span>
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    if (!projectKey) {
                      generateKeyFromName(e.target.value);
                    }
                  }}
                  placeholder="e.g., Website Redesign, Mobile App, Q1 Planning"
                  className="w-full px-3 py-2 border border-ui-border-primary rounded-md bg-ui-bg-primary text-ui-text-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="project-key"
                  className="block text-sm font-medium text-ui-text-primary mb-1"
                >
                  Project Key <span className="text-status-error">*</span>
                </label>
                <input
                  id="project-key"
                  type="text"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  placeholder="e.g., WEB, MOBILE, Q1"
                  className="w-full px-3 py-2 border border-ui-border-primary rounded-md bg-ui-bg-primary text-ui-text-primary font-mono"
                  maxLength={10}
                />
                <Typography className="text-xs text-ui-text-tertiary mt-1">
                  2-10 uppercase letters. This will prefix your issue keys (e.g.,{" "}
                  {projectKey || "KEY"}-123)
                </Typography>
              </div>

              <Textarea
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
              />
            </div>
          )}

          {/* Step 2: Board Type */}
          {step === 2 && (
            <div className="space-y-4">
              <Typography variant="h2" className="text-2xl font-bold text-ui-text-primary">
                Choose Your Board Type
              </Typography>
              <Typography className="text-ui-text-secondary">
                How do you want to organize your work? You can change this later.
              </Typography>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setBoardType("kanban")}
                  className={cn(
                    "p-6 border-2 rounded-lg text-left transition-all",
                    boardType === "kanban"
                      ? "border-brand-600 bg-brand-indigo-track"
                      : "border-ui-border-primary hover:border-brand-400",
                  )}
                >
                  <Typography variant="h3" className="font-bold text-lg mb-2 text-ui-text-primary">
                    📊 Kanban
                  </Typography>
                  <Typography className="text-sm text-ui-text-secondary">
                    Continuous flow of work through columns. Great for ongoing projects and support
                    teams.
                  </Typography>
                  <ul className="mt-3 text-xs text-ui-text-tertiary space-y-1">
                    <li>✓ No time constraints</li>
                    <li>✓ Visualize workflow</li>
                    <li>✓ Limit work in progress</li>
                  </ul>
                </button>

                <button
                  type="button"
                  onClick={() => setBoardType("scrum")}
                  className={cn(
                    "p-6 border-2 rounded-lg text-left transition-all",
                    boardType === "scrum"
                      ? "border-brand-600 bg-brand-indigo-track"
                      : "border-ui-border-primary hover:border-brand-400",
                  )}
                >
                  <Typography variant="h3" className="font-bold text-lg mb-2 text-ui-text-primary">
                    🏃 Scrum
                  </Typography>
                  <Typography className="text-sm text-ui-text-secondary">
                    Work in sprints with defined goals. Great for product development and fixed
                    deadlines.
                  </Typography>
                  <ul className="mt-3 text-xs text-ui-text-tertiary space-y-1">
                    <li>✓ Sprint planning</li>
                    <li>✓ Velocity tracking</li>
                    <li>✓ Burndown charts</li>
                  </ul>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Workflow States */}
          {step === 3 && (
            <div className="space-y-4">
              <Typography variant="h2" className="text-2xl font-bold text-ui-text-primary">
                Customize Your Workflow
              </Typography>
              <Typography className="text-ui-text-secondary">
                These are the stages your issues will move through. You can customize them now or
                use the defaults.
              </Typography>

              <Flex direction="column" gap="md">
                {workflowStates.map((state, index) => (
                  <Flex key={state.id} gap="md" align="center">
                    <span className="text-ui-text-tertiary font-mono text-sm w-6">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={state.name}
                      onChange={(e) => {
                        const newStates = [...workflowStates];
                        newStates[index].name = e.target.value;
                        setWorkflowStates(newStates);
                      }}
                      className="flex-1 px-3 py-2 border border-ui-border-primary rounded-md bg-ui-bg-primary text-ui-text-primary"
                    />
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        state.category === "todo"
                          ? "bg-ui-bg-tertiary text-ui-text-primary"
                          : state.category === "inprogress"
                            ? "bg-brand-indigo-track text-brand-indigo-text"
                            : "bg-status-success/10 text-status-success",
                      )}
                    >
                      {state.category === "todo"
                        ? "To Do"
                        : state.category === "inprogress"
                          ? "In Progress"
                          : "Done"}
                    </span>
                  </Flex>
                ))}
              </Flex>

              <Button
                onClick={() => {
                  const newId = `custom-${workflowStates.length}`;
                  setWorkflowStates([
                    ...workflowStates,
                    {
                      id: newId,
                      name: "New Status",
                      category: "inprogress",
                      order: workflowStates.length,
                    },
                  ]);
                }}
                variant="ghost"
                size="sm"
                className="text-brand-indigo-text"
              >
                + Add another status
              </Button>
            </div>
          )}

          {/* Step 4: Summary & Create */}
          {step === 4 && (
            <div className="space-y-4">
              <Typography variant="h2" className="text-2xl font-bold text-ui-text-primary">
                Ready to Create! 🎉
              </Typography>
              <Typography className="text-ui-text-secondary">
                Here's a summary of your new project:
              </Typography>

              <div className="bg-ui-bg-secondary rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm text-ui-text-tertiary">Project Name:</span>
                  <Typography className="font-medium text-ui-text-primary">
                    {projectName}
                  </Typography>
                </div>
                <div>
                  <span className="text-sm text-ui-text-tertiary">Project Key:</span>
                  <Typography className="font-mono font-medium text-ui-text-primary">
                    {projectKey}
                  </Typography>
                </div>
                <div>
                  <span className="text-sm text-ui-text-tertiary">Board Type:</span>
                  <Typography className="font-medium text-ui-text-primary capitalize">
                    {boardType}
                  </Typography>
                </div>
                <div>
                  <span className="text-sm text-ui-text-tertiary">Workflow States:</span>
                  <Flex wrap gap="sm" className="mt-1">
                    {workflowStates.map((state) => (
                      <span
                        key={state.id}
                        className="px-2 py-1 bg-ui-bg-tertiary rounded text-sm text-ui-text-primary"
                      >
                        {state.name}
                      </span>
                    ))}
                  </Flex>
                </div>
              </div>

              <Typography className="text-sm text-ui-text-secondary">
                Click "Create Project" and we'll set everything up for you. You can start adding
                issues right away!
              </Typography>
            </div>
          )}

          {/* Navigation Buttons */}
          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              {step > 1 && (
                <Button onClick={handlePrevious} variant="secondary">
                  Previous
                </Button>
              )}
            </div>
            <Flex gap="sm">
              <Button onClick={() => onOpenChange(false)} variant="secondary">
                Cancel
              </Button>
              {step < 4 ? (
                <Button onClick={handleNext} variant="primary">
                  Next
                </Button>
              ) : (
                <Button onClick={handleFinish} variant="primary" className="font-medium">
                  Create Project 🚀
                </Button>
              )}
            </Flex>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
