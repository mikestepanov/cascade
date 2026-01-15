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
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTE_PATTERNS } from "@/config/routes";

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
  const userCompanies = useQuery(api.companies.getUserCompanies);

  // Mutations
  const setPersona = useMutation(api.onboarding.setOnboardingPersona);
  const completeOnboarding = useMutation(api.onboarding.completeOnboardingFlow);

  // Determine initial step based on data
  useEffect(() => {
    if (inviteStatus !== undefined && step === "loading") {
      if (inviteStatus?.wasInvited) {
        // Invited users go to welcome screen (no role selection needed - role set by inviter)
        setStep("invited");
      } else {
        // Self-signup users pick their role
        setStep("role-select");
      }
    }
  }, [inviteStatus, step]);

  const handleRoleSelect = async (persona: "team_lead" | "team_member") => {
    setSelectedPersona(persona);
    await setPersona({ persona });

    if (persona === "team_lead") {
      setStep("lead-flow");
    } else {
      setStep("member-flow");
    }
  };

  // Navigate to the user's company dashboard
  const navigateToCompany = () => {
    if (userCompanies && userCompanies.length > 0) {
      // Use the first company available
      const slug = userCompanies[0].slug;
      if (slug) {
        navigate({
          to: `/${slug}/dashboard`,
        });
        return;
      }
    }

    // Fallback - redirect to /app gateway to trigger company initialization
    // (This is essential for the "team_member" flow or if the query is momentarily stale)
    navigate({ to: ROUTE_PATTERNS.app });
  };

  const handleComplete = async () => {
    await completeOnboarding();
    navigateToCompany();
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigateToCompany();
  };

  // Called when project is created during lead/member flow
  const handleWorkspaceCreated = (slug: string) => {
    navigate({
      to: ROUTE_PATTERNS.dashboard,
      params: { companySlug: slug },
    });
  };

  const handleProjectCreated = (_workspaceId: Id<"projects">) => {
    // Project was created, complete onboarding
    handleComplete();
  };

  // Loading state
  if (step === "loading") {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="min-h-screen bg-ui-bg-secondary">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Flex align="center" gap="sm">
          <Flex align="center" justify="center" className="h-8 w-8 rounded-lg bg-primary-600">
            <span className="text-white font-bold text-sm">N</span>
          </Flex>
          <span className="font-semibold text-lg text-ui-text-primary">Nixelo</span>
        </Flex>
        {step !== "invited" && (
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip for now
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Invited User Flow - skip role selection, go straight to complete */}
          {step === "invited" && inviteStatus && (
            <InvitedWelcome
              inviterName={inviteStatus.inviterName || "Someone"}
              onStartTour={handleComplete}
              onSkip={handleComplete}
            />
          )}

          {/* Role Selection */}
          {step === "role-select" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center">
                <Typography variant="h1" className="text-3xl font-bold mb-3 tracking-tight">
                  Welcome to Nixelo
                </Typography>
                <Typography variant="lead" className="text-ui-text-secondary">
                  How would you like to use your new workspace?
                </Typography>
              </div>

              <RoleSelector onSelect={handleRoleSelect} />

              <div className="pt-8 border-t border-ui-border-primary/50">
                <FeatureHighlights />
              </div>
            </div>
          )}

          {/* Team Lead Flow */}
          {step === "lead-flow" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <LeadOnboarding
                onComplete={handleComplete}
                onCreateProject={handleProjectCreated}
                onBack={() => setStep("role-select")}
                onWorkspaceCreated={handleWorkspaceCreated}
              />
            </div>
          )}

          {/* Team Member Flow */}
          {step === "member-flow" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <MemberOnboarding
                onComplete={handleComplete}
                onBack={() => setStep("role-select")}
                onWorkspaceCreated={handleWorkspaceCreated}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <Typography className="text-sm text-ui-text-tertiary">
          Need help?{" "}
          <a href="mailto:support@nixelo.com" className="text-primary-600 hover:underline">
            Contact support
          </a>
        </Typography>
      </footer>
    </Flex>
  );
}
