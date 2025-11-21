import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface SampleProjectModalProps {
  onCreateSampleProject: (projectId: Id<"projects">) => void;
  onStartFromScratch: () => void;
}

export function SampleProjectModal({
  onCreateSampleProject,
  onStartFromScratch,
}: SampleProjectModalProps) {
  const createSampleProject = useMutation(api.onboarding.createSampleProject);

  const handleCreateSample = async () => {
    try {
      const projectId = await createSampleProject();
      toast.success("Sample project created! Let's take a quick tour.");
      onCreateSampleProject(projectId as Id<"projects">);
    } catch (_error) {
      toast.error("Failed to create sample project");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
          Welcome to Cascade! 🎉
        </h2>
        <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-6">
          Would you like us to create a sample project with demo issues to help you explore Cascade?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCreateSample}
            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
          >
            Yes, show me around!
          </button>
          <button
            type="button"
            onClick={onStartFromScratch}
            className="flex-1 px-4 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded-md hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark"
          >
            I'll start from scratch
          </button>
        </div>
      </div>
    </div>
  );
}
