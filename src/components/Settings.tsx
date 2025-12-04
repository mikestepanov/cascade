import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { HourComplianceDashboard } from "./Admin/HourComplianceDashboard";
import { UserManagement } from "./Admin/UserManagement";
import { UserTypeManager } from "./Admin/UserTypeManager";
import { ApiKeysManager } from "./Settings/ApiKeysManager";
import { DevToolsTab } from "./Settings/DevToolsTab";
import { GitHubIntegration } from "./Settings/GitHubIntegration";
import { GoogleCalendarIntegration } from "./Settings/GoogleCalendarIntegration";
import { OfflineTab } from "./Settings/OfflineTab";
import { PreferencesTab } from "./Settings/PreferencesTab";
import { PumbleIntegration } from "./Settings/PumbleIntegration";
import { Tab, Tabs } from "./ui/Tabs";

const isTestEmail = (email?: string) => email?.endsWith("@inbox.mailtrap.io") ?? false;

export function Settings() {
  const currentUser = useQuery(api.users.getCurrent);
  const showDevTools = isTestEmail(currentUser?.email);

  const [activeTab, setActiveTab] = useState<
    "integrations" | "apikeys" | "offline" | "preferences" | "admin" | "developer"
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
        <Tabs className="mb-6 sm:mb-8 -mx-3 sm:mx-0 px-3 sm:px-0" aria-label="Settings tabs">
          <Tab
            value="integrations"
            isActive={activeTab === "integrations"}
            onClick={() => setActiveTab("integrations")}
          >
            Integrations
          </Tab>
          <Tab
            value="apikeys"
            isActive={activeTab === "apikeys"}
            onClick={() => setActiveTab("apikeys")}
          >
            API Keys
          </Tab>
          <Tab
            value="offline"
            isActive={activeTab === "offline"}
            onClick={() => setActiveTab("offline")}
          >
            Offline Mode
          </Tab>
          <Tab
            value="preferences"
            isActive={activeTab === "preferences"}
            onClick={() => setActiveTab("preferences")}
          >
            Preferences
          </Tab>
          <Tab value="admin" isActive={activeTab === "admin"} onClick={() => setActiveTab("admin")}>
            Admin
          </Tab>
          {showDevTools && (
            <Tab
              value="developer"
              isActive={activeTab === "developer"}
              onClick={() => setActiveTab("developer")}
            >
              Dev Tools
            </Tab>
          )}
        </Tabs>

        {/* Tab Content */}
        <div>
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "apikeys" && <ApiKeysManager />}
          {activeTab === "offline" && <OfflineTab />}
          {activeTab === "preferences" && <PreferencesTab />}
          {activeTab === "admin" && <AdminTab />}
          {activeTab === "developer" && showDevTools && <DevToolsTab />}
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
