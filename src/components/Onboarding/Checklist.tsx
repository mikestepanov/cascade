import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Flex } from "../ui/Flex";
import { Progress } from "../ui/progress";
import { Typography } from "../ui/Typography";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function OnboardingChecklist() {
  const [isExpanded, setIsExpanded] = useState(true);
  const onboarding = useQuery(api.onboarding.getOnboardingStatus);
  const projects = useQuery(api.projects.getCurrentUserProjects, {});
  // Efficient query - only checks if user has any completed issue
  const hasCompletedIssue = useQuery(api.onboarding.hasCompletedIssue);
  // Check if user has created any issues (just need count > 0)
  const userIssueCount = useQuery(api.issues.getUserIssueCount);
  const updateOnboarding = useMutation(api.onboarding.updateOnboardingStatus);

  if (!onboarding || onboarding.checklistDismissed || onboarding.onboardingCompleted) {
    return null;
  }

  // Calculate completion status for each task (using efficient backend queries)
  const hasProjects = (projects?.length ?? 0) > 0;
  const hasCreatedIssue = (userIssueCount ?? 0) > 0;

  const items: ChecklistItem[] = [
    {
      id: "tour",
      title: "Take the welcome tour",
      description: "Learn the basics of Nixelo",
      completed: onboarding.tourShown,
    },
    {
      id: "project",
      title: "Create a project",
      description: "Set up your first project or project",
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
    <div className="fixed bottom-6 right-6 w-80 bg-ui-bg-primary rounded-lg shadow-xl border border-ui-border-primary z-40">
      {/* Header */}
      <Flex justify="between" align="center" className="p-4 border-b border-ui-border-primary">
        <Flex gap="sm" align="center">
          <span className="text-lg">🚀</span>
          <div>
            <Typography variant="h3" className="font-semibold text-ui-text-primary">
              Getting Started
            </Typography>
            <Typography className="text-xs text-ui-text-tertiary">
              {completedCount} of {totalCount} complete
            </Typography>
          </div>
        </Flex>
        <Flex gap="sm" align="center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-ui-bg-secondary rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-ui-text-tertiary" />
            ) : (
              <ChevronUp className="w-4 h-4 text-ui-text-tertiary" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 hover:bg-ui-bg-secondary rounded"
          >
            <X className="w-4 h-4 text-ui-text-tertiary" />
          </button>
        </Flex>
      </Flex>

      {/* Progress Bar */}
      <div className="px-4 pt-3">
        <Progress value={progress} indicatorClassName="bg-status-success duration-500" />
      </div>

      {/* Checklist Items */}
      {isExpanded && (
        <Flex direction="column" gap="md" className="p-4">
          {items.map((item) => (
            <Flex key={item.id} gap="md" align="start">
              <div
                className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all",
                  item.completed
                    ? "bg-status-success border-status-success"
                    : "border-ui-border-secondary dark:border-ui-border-secondary-dark",
                )}
              >
                {item.completed && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <Typography
                  className={cn(
                    "font-medium text-sm",
                    item.completed
                      ? "text-ui-text-tertiary dark:text-ui-text-tertiary-dark line-through"
                      : "text-ui-text-primary dark:text-ui-text-primary-dark",
                  )}
                >
                  {item.title}
                </Typography>
                <Typography className="text-xs text-ui-text-tertiary">
                  {item.description}
                </Typography>
              </div>
            </Flex>
          ))}

          {/* Completion Message */}
          {allComplete && (
            <div className="mt-4 p-3 bg-status-success/10 dark:bg-status-success/20 rounded-lg border border-status-success/30 dark:border-status-success/50">
              <Typography className="text-sm font-medium text-status-success dark:text-status-success">
                🎉 Congratulations! You've completed the basics.
              </Typography>
              <Typography className="text-xs text-status-success/90 dark:text-status-success/80 mt-1">
                You're ready to use Nixelo! Feel free to dismiss this checklist.
              </Typography>
            </div>
          )}
        </Flex>
      )}
    </div>
  );
}
