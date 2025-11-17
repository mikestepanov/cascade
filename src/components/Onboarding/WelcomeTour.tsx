import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface WelcomeTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function WelcomeTour({ onComplete, onSkip }: WelcomeTourProps) {
  const updateOnboarding = useMutation(api.onboarding.updateOnboardingStatus);

  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: "#root",
          popover: {
            title: "Welcome to Cascade! 🎉",
            description:
              "Cascade is your all-in-one platform for project management and team collaboration. Let's take a quick tour to get you started!",
            side: "top",
            align: "center",
          },
        },
        {
          element: "[data-tour='command-palette']",
          popover: {
            title: "⌘K Command Palette",
            description:
              "Press <kbd>⌘K</kbd> (Mac) or <kbd>Ctrl+K</kbd> (Windows) to quickly search and navigate anywhere. It's the fastest way to get around!",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='create-project']",
          popover: {
            title: "Create Your First Project",
            description:
              "Projects organize your work into teams, issues, and documents. Click here to create your first project, or explore our sample project first!",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='dashboard']",
          popover: {
            title: "Your Dashboard",
            description:
              "This is your home base. See all your projects, recent issues, and activity at a glance. The dashboard updates in real-time as your team works.",
            side: "left",
            align: "start",
          },
        },
        {
          element: "[data-tour='sidebar']",
          popover: {
            title: "Document Sidebar",
            description:
              "Create and organize documents here. Cascade combines project management (like Jira) with document collaboration (like Confluence) in one place.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#root",
          popover: {
            title: "Ready to Get Started? 🚀",
            description:
              "You're all set! We've created a sample project with demo issues to help you explore. Feel free to edit, delete, or create your own project from scratch.",
            side: "top",
            align: "center",
          },
        },
      ],
      onDestroyStarted: () => {
        if (driverObj.hasNextStep() || driverObj.hasPreviousStep()) {
          // User closed the tour early (skipped)
          onSkip?.();
          void updateOnboarding({
            tourShown: true,
            onboardingStep: 2,
          });
        } else {
          // User completed the tour
          onComplete?.();
          void updateOnboarding({
            tourShown: true,
            onboardingStep: 2,
            onboardingCompleted: false, // Not fully done - still need to create first project
          });
        }
        driverObj.destroy();
      },
    });

    // Start the tour after a short delay to let the page render
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 500);

    return () => {
      clearTimeout(timer);
      driverObj.destroy();
    };
  }, [onComplete, onSkip, updateOnboarding]);

  return null; // This component doesn't render anything - it just controls the tour
}
