import { useEffect, useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import type { AppView } from "../utils/viewHelpers";

interface AppNavigationState {
  selectedDocumentId: Id<"documents"> | null;
  selectedProjectId: Id<"projects"> | null;
  activeView: AppView;
  showCommandPalette: boolean;
  showShortcutsHelp: boolean;
  isMobileSidebarOpen: boolean;
  showAIAssistant: boolean;
}

interface AppNavigationActions {
  setSelectedDocumentId: (id: Id<"documents"> | null) => void;
  setSelectedProjectId: (id: Id<"projects"> | null) => void;
  setActiveView: (view: AppView) => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowShortcutsHelp: (show: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setShowAIAssistant: (show: boolean | ((prev: boolean) => boolean)) => void;
  clearSelections: () => void;
  handleNavigate: (view: AppView) => void;
}

/**
 * Hook for managing main app navigation state
 */
export function useAppNavigation(): AppNavigationState & AppNavigationActions {
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"documents"> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const clearSelections = () => {
    setSelectedDocumentId(null);
    setSelectedProjectId(null);
  };

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    if (view === "dashboard") {
      clearSelections();
    }
  };

  return {
    selectedDocumentId,
    selectedProjectId,
    activeView,
    showCommandPalette,
    showShortcutsHelp,
    isMobileSidebarOpen,
    showAIAssistant,
    setSelectedDocumentId,
    setSelectedProjectId,
    setActiveView,
    setShowCommandPalette,
    setShowShortcutsHelp,
    setIsMobileSidebarOpen,
    setShowAIAssistant,
    clearSelections,
    handleNavigate,
  };
}

interface OnboardingState {
  showSampleProjectModal: boolean;
  showWelcomeTour: boolean;
  showProjectWizard: boolean;
  setShowSampleProjectModal: (show: boolean) => void;
  setShowWelcomeTour: (show: boolean) => void;
  setShowProjectWizard: (show: boolean) => void;
}

/**
 * Hook for managing onboarding state with automatic triggers
 */
export function useOnboardingState(
  loggedInUser: { email?: string } | null | undefined,
  onboardingStatus: { tourShown?: boolean } | null | undefined,
): OnboardingState {
  const [showSampleProjectModal, setShowSampleProjectModal] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showProjectWizard, setShowProjectWizard] = useState(false);

  // Check if user is new and should see onboarding
  useEffect(() => {
    if (!loggedInUser || onboardingStatus === undefined) return;

    // If no onboarding record exists, this is a brand new user
    if (!onboardingStatus) {
      setShowSampleProjectModal(true);
      return;
    }

    // Show welcome tour if they haven't seen it
    if (!(onboardingStatus.tourShown || showSampleProjectModal)) {
      setShowWelcomeTour(true);
    }
  }, [loggedInUser, onboardingStatus, showSampleProjectModal]);

  return {
    showSampleProjectModal,
    showWelcomeTour,
    showProjectWizard,
    setShowSampleProjectModal,
    setShowWelcomeTour,
    setShowProjectWizard,
  };
}
