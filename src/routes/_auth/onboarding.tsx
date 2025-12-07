import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { FeatureHighlights } from "@/components/Onboarding/FeatureHighlights";
import { InvitedWelcome } from "@/components/Onboarding/InvitedWelcome";
import { LeadOnboarding } from "@/components/Onboarding/LeadOnboarding";
import { MemberOnboarding } from "@/components/Onboarding/MemberOnboarding";
import { RoleSelector } from "@/components/Onboarding/RoleSelector";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/onboarding")({
  component: OnboardingPage,
});

type OnboardingStep = "loading" | "invited" | "role-select" | "lead-flow" | "member-flow";

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>("loading");
  const [, setSelectedPersona] = useState<"team_lead" | "team_member" | null>(null);

  // Queries
  const inviteStatus = useQuery(api.onboarding.checkInviteStatus);
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  // Mutations
  const setPersona = useMutation(api.onboarding.setOnboardingPersona);
  const completeOnboarding = useMutation(api.onboarding.completeOnboardingFlow);

  // Determine initial step based on data
  useEffect(() => {
    if (inviteStatus !== undefined && onboardingStatus !== undefined && step === "loading") {
      if (inviteStatus?.wasInvited) {
        setStep("invited");
      } else {
        setStep("role-select");
      }
    }
  }, [inviteStatus, onboardingStatus, step]);

  const handleRoleSelect = async (persona: "team_lead" | "team_member") => {
    setSelectedPersona(persona);
    await setPersona({ persona });

    if (persona === "team_lead") {
      setStep("lead-flow");
    } else {
      setStep("member-flow");
    }
  };

  const handleComplete = async () => {
    await completeOnboarding();
    navigate({ to: "/dashboard" });
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigate({ to: "/dashboard" });
  };

  const handleProjectCreated = (_projectId: Id<"projects">) => {
    // Project was created, complete onboarding
    handleComplete();
  };

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-lg text-ui-text-primary dark:text-ui-text-primary-dark">
            Nixelo
          </span>
        </div>
        {step !== "invited" && (
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip for now
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Invited User Flow */}
          {step === "invited" && inviteStatus && (
            <InvitedWelcome
              inviterName={inviteStatus.inviterName || "Someone"}
              onStartTour={() => setStep("role-select")}
              onSkip={handleComplete}
            />
          )}

          {/* Role Selection */}
          {step === "role-select" && (
            <div className="space-y-8">
              <div className="text-center">
                <Typography variant="h1" className="text-3xl font-bold mb-3">
                  Welcome to Nixelo
                </Typography>
                <Typography variant="lead">
                  Tell us a bit about how you'll be using Nixelo
                </Typography>
              </div>

              <RoleSelector onSelect={handleRoleSelect} />

              <div className="pt-4">
                <FeatureHighlights />
              </div>
            </div>
          )}

          {/* Team Lead Flow */}
          {step === "lead-flow" && (
            <LeadOnboarding
              onComplete={handleComplete}
              onCreateProject={handleProjectCreated}
              onBack={() => setStep("role-select")}
            />
          )}

          {/* Team Member Flow */}
          {step === "member-flow" && (
            <MemberOnboarding onComplete={handleComplete} onBack={() => setStep("role-select")} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
          Need help?{" "}
          <a href="mailto:support@nixelo.com" className="text-primary-600 hover:underline">
            Contact support
          </a>
        </p>
      </footer>
    </div>
  );
}
