import { useState } from "react";
import { HourComplianceDashboard } from "./Admin/HourComplianceDashboard";
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your account, integrations, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6 sm:mb-8 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <nav className="-mb-px flex gap-4 sm:gap-8 min-w-max" aria-label="Settings tabs">
            <button
              type="button"
              onClick={() => setActiveTab("integrations")}
              className={`
                py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
                ${
                  activeTab === "integrations"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
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
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
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
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
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
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
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
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
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
      <UserTypeManager />
      <HourComplianceDashboard />
    </div>
  );
}
