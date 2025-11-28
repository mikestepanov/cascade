import { useMutation } from "convex/react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Modal } from "../ui/Modal";

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
      showSuccess("Sample project created! Let's take a quick tour.");
      onCreateSampleProject(projectId as Id<"projects">);
    } catch (error) {
      showError(error, "Failed to create sample project");
    }
  };

  return (
    <Modal isOpen={true} onClose={onStartFromScratch} title="Welcome to Nixelo! 🎉" maxWidth="md">
      <div className="space-y-4">
        <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
          Would you like us to create a sample project with demo issues to help you explore Nixelo?
        </p>
        <Flex gap="md" className="pt-2">
          <Button onClick={handleCreateSample} variant="primary" className="flex-1">
            Yes, show me around!
          </Button>
          <Button onClick={onStartFromScratch} variant="secondary" className="flex-1">
            I'll start from scratch
          </Button>
        </Flex>
      </div>
    </Modal>
  );
}
