import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CommandPalette, useCommands } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { NixeloLanding } from "@/components/NixeloLanding";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createKeyboardShortcuts, createKeySequences } from "@/config/keyboardShortcuts";
import { useKeyboardShortcutsWithSequences } from "@/hooks/useKeyboardShortcuts";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  ssr: false, // Disable SSR for entire app section
});

function AppLayout() {
  return (
    <>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
      <Unauthenticated>
        <NixeloLanding />
      </Unauthenticated>
    </>
  );
}

function AuthenticatedApp() {
  const navigate = useNavigate();
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  // UI state for modals
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [_showAIAssistant, setShowAIAssistant] = useState(false);

  // Navigation callback for keyboard shortcuts
  const handleNavigate = useCallback(
    (to: string) => {
      navigate({ to });
    },
    [navigate],
  );

  // Build keyboard shortcuts
  const shortcuts = createKeyboardShortcuts({
    navigate: handleNavigate,
    setShowCommandPalette,
    setShowShortcutsHelp,
    setShowAIAssistant,
  });

  const sequences = createKeySequences({
    navigate: handleNavigate,
    setShowCommandPalette,
    setShowShortcutsHelp,
    setShowAIAssistant,
  });

  // Enable keyboard shortcuts
  useKeyboardShortcutsWithSequences(shortcuts, sequences, true);

  // Build command palette commands
  const commands = useCommands();

  // Loading state while checking onboarding
  if (onboardingStatus === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to onboarding if not completed
  if (onboardingStatus === null || !onboardingStatus.onboardingCompleted) {
    // Use effect to navigate to avoid render-time navigation
    navigate({ to: "/onboarding" });
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
      {/* Global header with navigation */}
      <AppHeader
        onShowCommandPalette={() => setShowCommandPalette(true)}
        onShowShortcutsHelp={() => setShowShortcutsHelp(true)}
      />

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
}
