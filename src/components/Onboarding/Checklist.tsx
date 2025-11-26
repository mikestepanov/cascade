import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "@/lib/icons";
import { api } from "../../../convex/_generated/api";
import { Flex } from "../ui/Flex";

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
    <div className="fixed bottom-6 right-6 w-80 bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl border border-ui-border-primary dark:border-ui-border-primary-dark z-40">
      {/* Header */}
      <Flex
        justify="between"
        align="center"
        className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark"
      >
        <Flex gap="sm" align="center">
          <span className="text-lg">🚀</span>
          <div>
            <h3 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
              Getting Started
            </h3>
            <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              {completedCount} of {totalCount} complete
            </p>
          </div>
        </Flex>
        <Flex gap="sm" align="center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
            ) : (
              <ChevronUp className="w-4 h-4 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded"
          >
            <X className="w-4 h-4 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
          </button>
        </Flex>
      </Flex>

      {/* Progress Bar */}
      <div className="px-4 pt-3">
        <div className="w-full bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-full h-2">
          <div
            className="bg-status-success h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      {isExpanded && (
        <Flex direction="column" gap="md" className="p-4">
          {items.map((item) => (
            <Flex key={item.id} gap="md" align="start">
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                  item.completed
                    ? "bg-status-success border-status-success"
                    : "border-ui-border-secondary dark:border-ui-border-secondary-dark"
                }`}
              >
                {item.completed && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium text-sm ${
                    item.completed
                      ? "text-ui-text-tertiary dark:text-ui-text-tertiary-dark line-through"
                      : "text-ui-text-primary dark:text-ui-text-primary-dark"
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                  {item.description}
                </p>
              </div>
            </Flex>
          ))}

          {/* Completion Message */}
          {allComplete && (
            <div className="mt-4 p-3 bg-status-success/10 dark:bg-status-success/20 rounded-lg border border-status-success/30 dark:border-status-success/50">
              <p className="text-sm font-medium text-status-success dark:text-status-success">
                🎉 Congratulations! You've completed the basics.
              </p>
              <p className="text-xs text-status-success/90 dark:text-status-success/80 mt-1">
                You're ready to use Cascade! Feel free to dismiss this checklist.
              </p>
            </div>
          )}
        </Flex>
      )}
    </div>
  );
}
