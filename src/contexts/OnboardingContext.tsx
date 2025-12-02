import { useMutation, useQuery } from "convex/react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface OnboardingContextType {
  // State
  isOnboardingComplete: boolean;
  currentStep: number;
  showWelcome: boolean;
  showTour: boolean;
  sampleProjectId: Id<"projects"> | null;

  // Actions
  startOnboarding: () => void;
  nextStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  setShowWelcome: (show: boolean) => void;
  setShowTour: (show: boolean) => void;
  createSampleProject: () => Promise<Id<"projects">>;
  deleteSampleProject: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [sampleProjectId, setSampleProjectId] = useState<Id<"projects"> | null>(null);

  // Queries and mutations
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const updateStatus = useMutation(api.onboarding.updateOnboardingStatus);
  const createSample = useMutation(api.onboarding.createSampleProject);
  const deleteSample = useMutation(api.onboarding.deleteSampleProject);

  const isOnboardingComplete = onboardingStatus?.onboardingCompleted ?? false;
  const currentStep = onboardingStatus?.onboardingStep ?? 0;

  const startOnboarding = () => {
    setShowWelcome(false);
    setShowTour(true);
  };

  const nextStep = async () => {
    if (onboardingStatus) {
      const newStep = (onboardingStatus.onboardingStep ?? 0) + 1;
      await updateStatus({ onboardingStep: newStep });
    }
  };

  const skipOnboarding = async () => {
    await updateStatus({
      onboardingCompleted: true,
      checklistDismissed: true,
    });
    setShowWelcome(false);
    setShowTour(false);
  };

  const completeOnboarding = async () => {
    await updateStatus({
      onboardingCompleted: true,
      tourShown: true,
    });
    setShowTour(false);
  };

  const createSampleProject = async (): Promise<Id<"projects">> => {
    const projectId = await createSample();
    setSampleProjectId(projectId);
    await updateStatus({ sampleProjectCreated: true });
    return projectId;
  };

  const deleteSampleProject = async () => {
    await deleteSample();
    setSampleProjectId(null);
    await updateStatus({ sampleProjectCreated: false });
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        currentStep,
        showWelcome,
        showTour,
        sampleProjectId,
        startOnboarding,
        nextStep,
        skipOnboarding,
        completeOnboarding,
        setShowWelcome,
        setShowTour,
        createSampleProject,
        deleteSampleProject,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
