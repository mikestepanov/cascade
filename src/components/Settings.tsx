import { useState } from "react";
import { HourComplianceDashboard } from "./Admin/HourComplianceDashboard";
import { UserManagement } from "./Admin/UserManagement";
import { UserTypeManager } from "./Admin/UserTypeManager";
import { ApiKeysManager } from "./Settings/ApiKeysManager";
import { GitHubIntegration } from "./Settings/GitHubIntegration";
import { GoogleCalendarIntegration } from "./Settings/GoogleCalendarIntegration";
import { OfflineTab } from "./Settings/OfflineTab";
import { PreferencesTab } from "./Settings/PreferencesTab";
import { PumbleIntegration } from "./Settings/PumbleIntegration";

export function Settings() {
  const [activeTab, setActiveTab] = useState<
    "integrations" | "apikeys" | "offline" | "preferences" | "admin"
  >("integrations");

  return (
    <div className="min-h-screen bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
            Settings
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-ui-text-secondary dark:text-ui-text-secondary-dark">
            Manage your account, integrations, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark mb-6 sm:mb-8 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <nav className="-mb-px flex gap-4 sm:gap-8 min-w-max" aria-label="Settings tabs">
            <button
              type="button"
              onClick={() => setActiveTab("integrations")}
              className={`
                py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
                ${
                  activeTab === "integrations"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:border-ui-border-primary dark:hover:border-ui-border-primary-dark"
                }
              `}
            >
              Integrations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("apikeys")}
              className={`
                py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
                ${
                  activeTab === "apikeys"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:border-ui-border-primary dark:hover:border-ui-border-primary-dark"
                }
              `}
            >
              API Keys
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("offline")}
              className={`
                py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
                ${
                  activeTab === "offline"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:border-ui-border-primary dark:hover:border-ui-border-primary-dark"
                }
              `}
            >
              Offline Mode
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`
                py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
                ${
                  activeTab === "preferences"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:border-ui-border-primary dark:hover:border-ui-border-primary-dark"
                }
              `}
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`
                py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
                ${
                  activeTab === "admin"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:border-ui-border-primary dark:hover:border-ui-border-primary-dark"
                }
              `}
            >
              Admin
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "apikeys" && <ApiKeysManager />}
          {activeTab === "offline" && <OfflineTab />}
          {activeTab === "preferences" && <PreferencesTab />}
          {activeTab === "admin" && <AdminTab />}
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <GitHubIntegration />
      <GoogleCalendarIntegration />
      <PumbleIntegration />
    </div>
  );
}

function AdminTab() {
  return (
    <div className="space-y-8">
      <UserManagement />
      <UserTypeManager />
      <HourComplianceDashboard />
    </div>
  );
}
