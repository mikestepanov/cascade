import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {step} of 4
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round((step / 4) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Project Name & Key */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Your First Project</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Let's start by giving your project a name and a unique key.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Name <span className="text-red-500">*</span>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                placeholder="e.g., WEB, MOBILE, Q1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                2-10 uppercase letters. This will prefix your issue keys (e.g., {projectKey || "KEY"}-123)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 2: Board Type */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Board Type</h2>
            <p className="text-gray-600 dark:text-gray-400">
              How do you want to organize your work? You can change this later.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setBoardType("kanban")}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  boardType === "kanban"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                }`}
              >
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">📊 Kanban</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Continuous flow of work through columns. Great for ongoing projects and support teams.
                </p>
                <ul className="mt-3 text-xs text-gray-500 dark:text-gray-500 space-y-1">
                  <li>✓ No time constraints</li>
                  <li>✓ Visualize workflow</li>
                  <li>✓ Limit work in progress</li>
                </ul>
              </button>

              <button
                onClick={() => setBoardType("scrum")}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  boardType === "scrum"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                }`}
              >
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">🏃 Scrum</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Work in sprints with defined goals. Great for product development and fixed deadlines.
                </p>
                <ul className="mt-3 text-xs text-gray-500 dark:text-gray-500 space-y-1">
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customize Your Workflow</h2>
            <p className="text-gray-600 dark:text-gray-400">
              These are the stages your issues will move through. You can customize them now or use the defaults.
            </p>

            <div className="space-y-3">
              {workflowStates.map((state, index) => (
                <div key={state.id} className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400 font-mono text-sm w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={state.name}
                    onChange={(e) => {
                      const newStates = [...workflowStates];
                      newStates[index].name = e.target.value;
                      setWorkflowStates(newStates);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      state.category === "todo"
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        : state.category === "inprogress"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    }`}
                  >
                    {state.category === "todo" ? "To Do" : state.category === "inprogress" ? "In Progress" : "Done"}
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
              className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
            >
              + Add another status
            </button>
          </div>
        )}

        {/* Step 4: Summary & Create */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ready to Create! 🎉</h2>
            <p className="text-gray-600 dark:text-gray-400">Here's a summary of your new project:</p>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Project Name:</span>
                <p className="font-medium text-gray-900 dark:text-white">{projectName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Project Key:</span>
                <p className="font-mono font-medium text-gray-900 dark:text-white">{projectKey}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Board Type:</span>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{boardType}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Workflow States:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {workflowStates.map((state) => (
                    <span
                      key={state.id}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white"
                    >
                      {state.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click "Create Project" and we'll set everything up for you. You can start adding issues right away!
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            {step > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
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
