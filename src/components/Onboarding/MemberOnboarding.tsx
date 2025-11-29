import { ArrowLeft, Bell, CheckCircle, Clock, FileText, Kanban } from "lucide-react";
import { Button } from "../ui/Button";

interface MemberOnboardingProps {
  onComplete: () => void;
  onBack: () => void;
}

export function MemberOnboarding({ onComplete, onBack }: MemberOnboardingProps) {
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
          You're All Set!
        </h1>
        <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark text-lg">
          Here's what you need to know as a team member
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Waiting for an invitation?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your team lead will add you to projects. Once added, you'll see them on your dashboard
              and receive notifications for assigned tasks.
            </p>
          </div>
        </div>
      </div>

      {/* What you can do */}
      <div className="space-y-4">
        <h3 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
          Here's what you can do in Nixelo:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-ui-bg-primary dark:bg-ui-bg-secondary-dark">
            <Kanban className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark text-sm">
                Work on Issues
              </h4>
              <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Drag issues across the board as you progress
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-ui-bg-primary dark:bg-ui-bg-secondary-dark">
            <FileText className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark text-sm">
                Collaborate on Docs
              </h4>
              <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Edit documents together in real-time
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-ui-bg-primary dark:bg-ui-bg-secondary-dark">
            <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark text-sm">
                Track Time
              </h4>
              <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Log time spent on tasks
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-ui-bg-primary dark:bg-ui-bg-secondary-dark">
            <Bell className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark text-sm">
                Stay Updated
              </h4>
              <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Get notified when mentioned or assigned
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts tip */}
      <div className="bg-ui-bg-primary dark:bg-ui-bg-secondary-dark rounded-xl p-4 text-center">
        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
          <span className="font-medium">Pro tip:</span> Press{" "}
          <kbd className="px-2 py-0.5 rounded bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-xs font-mono">
            Ctrl+K
          </kbd>{" "}
          or{" "}
          <kbd className="px-2 py-0.5 rounded bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-xs font-mono">
            Cmd+K
          </kbd>{" "}
          to open the command palette
        </p>
      </div>

      {/* Continue */}
      <div className="flex justify-center">
        <Button variant="primary" size="lg" onClick={onComplete} className="min-w-[200px]">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
