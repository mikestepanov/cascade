import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface WelcomeModalProps {
  onNavigateToProject?: (projectId: Id<"projects">) => void;
}

export function WelcomeModal({ onNavigateToProject }: WelcomeModalProps = {}) {
  const { showWelcome, setShowWelcome, startOnboarding, skipOnboarding, createSampleProject } =
    useOnboarding();
  const [isCreatingSample, setIsCreatingSample] = useState(false);

  if (!showWelcome) return null;

  const handleGetStarted = async () => {
    setIsCreatingSample(true);
    try {
      const projectId = await createSampleProject();
      setShowWelcome(false);
      // Navigate to the sample project via callback
      if (onNavigateToProject) {
        onNavigateToProject(projectId);
      }
      // Start the product tour
      startOnboarding();
    } catch (_error) {
      // Sample project creation errors are non-critical
    } finally {
      setIsCreatingSample(false);
    }
  };

  const handleSkip = () => {
    skipOnboarding();
  };

  return (
    <Modal isOpen={showWelcome} onClose={handleSkip} maxWidth="xl">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Welcome to Cascade!
          </h1>
          <p className="text-lg text-ui-text-secondary dark:text-ui-text-secondary-dark">
            Your all-in-one workspace for projects, tasks, and collaboration
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
              Kanban Boards
            </h3>
            <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
              Visualize workflow with drag-and-drop boards
            </p>
          </div>

          <div className="text-center p-4">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
              Rich Documents
            </h3>
            <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
              Collaborate in real-time like Confluence
            </p>
          </div>

          <div className="text-center p-4">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
              Sprint Planning
            </h3>
            <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
              Plan and track sprints with team velocity
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="text-base px-8"
            disabled={isCreatingSample}
          >
            {isCreatingSample ? "Creating Sample Project..." : "🎯 Get Started with a Demo"}
          </Button>
          <Button onClick={handleSkip} variant="secondary" size="lg" className="text-base px-8">
            Skip Tour
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-6">
          We'll create a sample project to help you explore Cascade's features.
          <br />
          You can delete it anytime.
        </p>
      </div>
    </Modal>
  );
}
