import { useMutation } from "convex/react";
import { ArrowLeft, FolderPlus, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { FeatureHighlights } from "./FeatureHighlights";

interface LeadOnboardingProps {
  onComplete: () => void;
  onCreateProject: (projectId: Id<"projects">) => void;
  onBack: () => void;
}

type LeadStep = "features" | "project-choice" | "creating";

export function LeadOnboarding({ onComplete, onCreateProject, onBack }: LeadOnboardingProps) {
  const [step, setStep] = useState<LeadStep>("features");
  const [isCreating, setIsCreating] = useState(false);

  const createSampleProject = useMutation(api.onboarding.createSampleProject);

  const handleCreateSample = async () => {
    setIsCreating(true);
    try {
      const projectId = await createSampleProject();
      showSuccess("Sample project created! Explore and customize it.");
      onCreateProject(projectId as Id<"projects">);
    } catch (error) {
      showError(error, "Failed to create sample project");
      setIsCreating(false);
    }
  };

  if (step === "features") {
    return (
      <div className="space-y-8">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Perfect for Team Leads
          </h1>
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark text-lg">
            Here's what you can do with Nixelo
          </p>
        </div>

        {/* Feature Highlights */}
        <FeatureHighlights />

        {/* Additional lead features */}
        <div className="bg-ui-bg-primary dark:bg-ui-bg-secondary-dark rounded-xl p-6">
          <h3 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
            As a team lead, you can also:
          </h3>
          <ul className="space-y-3 text-ui-text-secondary dark:text-ui-text-secondary-dark">
            <li className="flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
              <span>Invite team members and manage roles</span>
            </li>
            <li className="flex items-start gap-3">
              <FolderPlus className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
              <span>Create and customize project workflows</span>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
              <span>Use AI to generate issue suggestions and summaries</span>
            </li>
          </ul>
        </div>

        {/* Continue */}
        <div className="flex justify-center">
          <Button variant="primary" size="lg" onClick={() => setStep("project-choice")}>
            Let's set up your workspace
          </Button>
        </div>
      </div>
    );
  }

  if (step === "project-choice") {
    return (
      <div className="space-y-8">
        {/* Back button */}
        <button
          type="button"
          onClick={() => setStep("features")}
          className="flex items-center gap-2 text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Start Your First Project
          </h1>
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark text-lg">
            How would you like to get started?
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sample Project */}
          <button
            type="button"
            onClick={handleCreateSample}
            disabled={isCreating}
            className="p-6 rounded-xl border-2 border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-secondary-dark text-left transition-all hover:border-primary-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 w-fit">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                  {isCreating ? "Creating..." : "Start with a Sample"}
                </h3>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Explore Nixelo with pre-filled demo issues and sprints
                </p>
              </div>
              <span className="text-xs text-primary-600 font-medium">Recommended</span>
            </div>
          </button>

          {/* Start Fresh */}
          <button
            type="button"
            onClick={onComplete}
            disabled={isCreating}
            className="p-6 rounded-xl border-2 border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-secondary-dark text-left transition-all hover:border-primary-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark w-fit">
                <FolderPlus className="w-6 h-6 text-ui-text-secondary dark:text-ui-text-secondary-dark" />
              </div>
              <div>
                <h3 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                  Start from Scratch
                </h3>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Create your own project with a blank canvas
                </p>
              </div>
              <span className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                For experienced users
              </span>
            </div>
          </button>
        </div>

        {/* Skip option */}
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onComplete} disabled={isCreating}>
            I'll explore on my own
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
