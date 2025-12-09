import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { createContext, useCallback, useContext, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandPalette, useCommands } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { createKeyboardShortcuts, createKeySequences } from "@/config/keyboardShortcuts";
import { useKeyboardShortcutsWithSequences } from "@/hooks/useKeyboardShortcuts";
import { SidebarProvider } from "@/hooks/useSidebarState";

// Company context type
interface CompanyContextType {
  companyId: string;
  companySlug: string;
  companyName: string;
  userRole: "owner" | "admin" | "member";
}

const CompanyContext = createContext<CompanyContextType | null>(null);

/**
 * Hook to access current company from URL
 * Must be used within a $companySlug route
 */
export function useCompany(): CompanyContextType {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a company route");
  }
  return context;
}

/**
 * Optional hook to access company - returns null if not in company context
 * Use this for components that might render before context is available
 */
export function useCompanyOptional(): CompanyContextType | null {
  return useContext(CompanyContext);
}

export const Route = createFileRoute("/_auth/_app/$companySlug")({
  component: CompanyLayout,
  ssr: false, // Disable SSR to prevent hydration issues with CompanyContext
});

function CompanyLayout() {
  const { companySlug } = Route.useParams();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

  // Skip queries until auth is ready - this prevents queries from running during auth hydration
  const userCompanies = useQuery(
    api.companies.getUserCompanies,
    isAuthenticated ? undefined : "skip",
  );

  // Fetch company by slug - also skip until authenticated
  const company = useQuery(
    api.companies.getCompanyBySlug,
    isAuthenticated ? { slug: companySlug } : "skip",
  );

  // Loading state - wait for auth AND queries
  if (isAuthLoading || company === undefined || userCompanies === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Not authenticated - parent _auth route should handle this, but just in case
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Company not found
  if (company === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark p-4">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2">
            Company not found
          </Typography>
          <Typography variant="p" color="secondary">
            The company "{companySlug}" does not exist.
          </Typography>
        </div>
      </div>
    );
  }

  // Check user has access to this company
  const userCompany = userCompanies.find((c) => c._id === company._id);

  if (!userCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark p-4">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2">
            Access denied
          </Typography>
          <Typography variant="p" color="secondary">
            You don't have access to this company.
          </Typography>
        </div>
      </div>
    );
  }

  const companyContext: CompanyContextType = {
    companyId: company._id,
    companySlug: company.slug,
    companyName: company.name,
    userRole: userCompany.userRole,
  };

  return (
    <CompanyContext.Provider value={companyContext}>
      <CompanyLayoutInner />
    </CompanyContext.Provider>
  );
}

// Inner component that can safely use useCompany and other hooks
function CompanyLayoutInner() {
  const navigate = useNavigate();

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

  // Build keyboard shortcuts (need companySlug for navigation)
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        {/* Unified sidebar */}
        <AppSidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Slim header */}
          <AppHeader
            onShowCommandPalette={() => setShowCommandPalette(true)}
            onShowShortcutsHelp={() => setShowShortcutsHelp(true)}
          />

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>

        {/* Command Palette Modal */}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          commands={commands}
        />

        {/* Keyboard Shortcuts Help Modal */}
        <KeyboardShortcutsHelp open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />
      </div>
    </SidebarProvider>
  );
}
