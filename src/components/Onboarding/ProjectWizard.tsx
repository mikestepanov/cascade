import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

interface ProjectWizardProps {
  onComplete: (projectId: string) => void;
  onCancel: () => void;
}

export function ProjectWizard({ onComplete, onCancel }: ProjectWizardProps) {
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

  const createProject = useMutation(api.projects.create);
  const updateOnboarding = useMutation(api.onboarding.updateOnboardingStatus);

  const handleNext = () => {
    if (step === 1) {
      if (!projectName.trim()) {
        toast.error("Project name is required");
        return;
      }
      if (!projectKey.trim()) {
        toast.error("Project key is required");
        return;
      }
      if (projectKey.length < 2 || projectKey.length > 10) {
        toast.error("Project key must be 2-10 characters");
        return;
      }
      if (!/^[A-Z]+$/.test(projectKey)) {
        toast.error("Project key must be uppercase letters only");
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
      const projectId = await createProject({
        name: projectName,
        key: projectKey,
        description: description || undefined,
        isPublic: false,
        boardType,
        workflowStates,
      });

      // Update onboarding status
      await updateOnboarding({
        wizardCompleted: true,
        onboardingStep: 3,
      });

      // Confetti effect (optional - would need react-confetti package)
      toast.success("🎉 Project created successfully!");

      onComplete(projectId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
              Step {step} of 4
            </span>
            <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              {Math.round((step / 4) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-full h-2">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Project Name & Key */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
              Create Your First Project
            </h2>
            <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
              Let's start by giving your project a name and a unique key.
            </p>

            <div>
              <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                Project Name <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  if (!projectKey) {
                    generateKeyFromName(e.target.value);
                  }
                }}
                placeholder="e.g., Website Redesign, Mobile App, Q1 Planning"
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                Project Key <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                placeholder="e.g., WEB, MOBILE, Q1"
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark font-mono"
                maxLength={10}
              />
              <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
                2-10 uppercase letters. This will prefix your issue keys (e.g.,{" "}
                {projectKey || "KEY"}-123)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 2: Board Type */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
              Choose Your Board Type
            </h2>
            <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
              How do you want to organize your work? You can change this later.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setBoardType("kanban")}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  boardType === "kanban"
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20"
                    : "border-ui-border-primary dark:border-ui-border-primary-dark hover:border-brand-400"
                }`}
              >
                <h3 className="font-bold text-lg mb-2 text-ui-text-primary dark:text-ui-text-primary-dark">📊 Kanban</h3>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Continuous flow of work through columns. Great for ongoing projects and support
                  teams.
                </p>
                <ul className="mt-3 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark space-y-1">
                  <li>✓ No time constraints</li>
                  <li>✓ Visualize workflow</li>
                  <li>✓ Limit work in progress</li>
                </ul>
              </button>

              <button
                onClick={() => setBoardType("scrum")}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  boardType === "scrum"
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20"
                    : "border-ui-border-primary dark:border-ui-border-primary-dark hover:border-brand-400"
                }`}
              >
                <h3 className="font-bold text-lg mb-2 text-ui-text-primary dark:text-ui-text-primary-dark">🏃 Scrum</h3>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Work in sprints with defined goals. Great for product development and fixed
                  deadlines.
                </p>
                <ul className="mt-3 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark space-y-1">
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
            <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
              Customize Your Workflow
            </h2>
            <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
              These are the stages your issues will move through. You can customize them now or use
              the defaults.
            </p>

            <div className="space-y-3">
              {workflowStates.map((state, index) => (
                <div key={state.id} className="flex items-center gap-3">
                  <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark font-mono text-sm w-6">
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
                    className="flex-1 px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
                  />
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      state.category === "todo"
                        ? "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
                        : state.category === "inprogress"
                          ? "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                          : "bg-status-success/10 dark:bg-status-success/30 text-status-success dark:text-status-success"
                    }`}
                  >
                    {state.category === "todo"
                      ? "To Do"
                      : state.category === "inprogress"
                        ? "In Progress"
                        : "Done"}
                  </span>
                </div>
              ))}
            </div>

            <button
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
              className="text-brand-600 dark:text-brand-400 text-sm font-medium hover:underline"
            >
              + Add another status
            </button>
          </div>
        )}

        {/* Step 4: Summary & Create */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
              Ready to Create! 🎉
            </h2>
            <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
              Here's a summary of your new project:
            </p>

            <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">Project Name:</span>
                <p className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">{projectName}</p>
              </div>
              <div>
                <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">Project Key:</span>
                <p className="font-mono font-medium text-ui-text-primary dark:text-ui-text-primary-dark">{projectKey}</p>
              </div>
              <div>
                <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">Board Type:</span>
                <p className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark capitalize">{boardType}</p>
              </div>
              <div>
                <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">Workflow States:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {workflowStates.map((state) => (
                    <span
                      key={state.id}
                      className="px-2 py-1 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded text-sm text-ui-text-primary dark:text-ui-text-primary-dark"
                    >
                      {state.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
              Click "Create Project" and we'll set everything up for you. You can start adding
              issues right away!
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
          <div>
            {step > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded-md"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded-md"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-6 py-2 bg-status-success text-white rounded-md hover:bg-status-success/90 font-medium"
              >
                Create Project 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
