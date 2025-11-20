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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Cascade! 🎉
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Would you like us to create a sample project with demo issues to help you explore Cascade?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCreateSample}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Yes, show me around!
          </button>
          <button
            type="button"
            onClick={onStartFromScratch}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            I'll start from scratch
          </button>
        </div>
      </div>
    </div>
  );
}
