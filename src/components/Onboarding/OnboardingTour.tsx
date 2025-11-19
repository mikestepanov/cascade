import { useEffect, useState } from "react";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Button } from "../ui/Button";

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: ".dashboard-view",
    title: "Welcome to Your Dashboard",
    content: "This is your personal hub. See all your assigned issues and recent activity here.",
    placement: "bottom",
  },
  {
    target: ".projects-nav",
    title: "Projects",
    content: "Access all your projects here. Each project has a Kanban board and documents.",
    placement: "bottom",
  },
  {
    target: ".kanban-board",
    title: "Kanban Board",
    content:
      "Drag and drop issues between columns to update their status. Real-time for the whole team!",
    placement: "top",
  },
  {
    target: ".create-issue-button",
    title: "Create Issues",
    content: "Click here to create tasks, bugs, stories, and epics for your project.",
    placement: "left",
  },
  {
    target: ".global-search",
    title: "Quick Search",
    content: "Press ⌘K (or Ctrl+K) to quickly search across all projects, issues, and documents.",
    placement: "bottom",
  },
];

export function OnboardingTour() {
  const { showTour, completeOnboarding, currentStep, nextStep } = useOnboarding();
  const [step, setStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const currentTourStep = TOUR_STEPS[step];
  const isLastStep = step === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (!showTour) return;

    const updatePosition = () => {
      const element = document.querySelector(currentTourStep?.target);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const placement = currentTourStep.placement || "bottom";

      let top = 0;
      let left = 0;

      switch (placement) {
        case "bottom":
          top = rect.bottom + 16;
          left = rect.left + rect.width / 2;
          break;
        case "top":
          top = rect.top - 16;
          left = rect.left + rect.width / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - 16;
          break;
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + 16;
          break;
      }

      setTooltipPosition({ top, left });

      // Add spotlight effect
      element.classList.add("onboarding-spotlight");
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      const element = document.querySelector(currentTourStep?.target);
      if (element) {
        element.classList.remove("onboarding-spotlight");
      }
    };
  }, [showTour, step, currentTourStep]);

  if (!showTour || !currentTourStep) return null;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      setStep(step + 1);
      nextStep();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 pointer-events-none"
        style={{ backdropFilter: "blur(2px)" }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-sm transform -translate-x-1/2 -translate-y-1/2"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Progress */}
        <div className="flex items-center gap-1 mb-4">
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                index <= step ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {currentTourStep.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{currentTourStep.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {step + 1} of {TOUR_STEPS.length}
          </span>
          <div className="flex gap-2">
            <Button onClick={handleSkip} variant="secondary" size="sm">
              Skip Tour
            </Button>
            <Button onClick={handleNext} size="sm">
              {isLastStep ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
