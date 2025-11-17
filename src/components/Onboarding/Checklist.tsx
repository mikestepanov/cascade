import { useMutation, useQuery } from "convex/react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function OnboardingChecklist() {
  const [isExpanded, setIsExpanded] = useState(true);
  const onboarding = useQuery(api.onboarding.getOnboardingStatus);
  const projects = useQuery(api.projects.list, {});
  const issues = useQuery(api.issues.listByUser, {});
  const updateOnboarding = useMutation(api.onboarding.updateOnboardingStatus);

  if (!onboarding || onboarding.checklistDismissed || onboarding.onboardingCompleted) {
    return null;
  }

  // Calculate completion status for each task
  const hasProjects = (projects?.length ?? 0) > 0;
  const hasCreatedIssue = (issues?.length ?? 0) > 0;
  const hasCompletedIssue =
    issues?.some((issue) => {
      // Check if issue has a status in the "done" category
      // This would require fetching the project to check workflow states
      // For now, we'll use a simple check
      return issue.status === "done";
    }) ?? false;

  const items: ChecklistItem[] = [
    {
      id: "tour",
      title: "Take the welcome tour",
      description: "Learn the basics of Cascade",
      completed: onboarding.tourShown,
    },
    {
      id: "project",
      title: "Create a project",
      description: "Set up your first project or workspace",
      completed: hasProjects || onboarding.wizardCompleted,
    },
    {
      id: "issue",
      title: "Create an issue",
      description: "Add a task, bug, or story to track",
      completed: hasCreatedIssue,
    },
    {
      id: "complete",
      title: "Complete an issue",
      description: "Move an issue to 'Done'",
      completed: hasCompletedIssue,
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const allComplete = completedCount === totalCount;

  const handleDismiss = () => {
    void updateOnboarding({
      checklistDismissed: true,
      onboardingCompleted: allComplete,
    });
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚀</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Getting Started</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {completedCount} of {totalCount} complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                  item.completed
                    ? "bg-green-600 border-green-600"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {item.completed && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium text-sm ${
                    item.completed
                      ? "text-gray-500 dark:text-gray-400 line-through"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            </div>
          ))}

          {/* Completion Message */}
          {allComplete && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                🎉 Congratulations! You've completed the basics.
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                You're ready to use Cascade! Feel free to dismiss this checklist.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
