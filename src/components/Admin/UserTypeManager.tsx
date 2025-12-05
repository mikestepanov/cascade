import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Input, Select, Textarea } from "../ui/form";

type EmploymentType = "employee" | "contractor" | "intern";

// Type for profile with user and manager data (returned from listUserProfiles query)
type UserProfileWithUser = Doc<"userProfiles"> & {
  user: Doc<"users"> | null;
  manager: Doc<"users"> | null;
};

// Helper: Convert string to number or undefined
function parseOptionalNumber(value: string): number | undefined {
  return value ? Number(value) : undefined;
}

// Helper: Convert date string to timestamp or undefined
function parseOptionalDate(value: string): number | undefined {
  return value ? new Date(value).getTime() : undefined;
}

// Helper: Build profile data from form state
function buildProfileData(formData: {
  userId: Id<"users">;
  profileType: EmploymentType;
  profileMaxWeekly: string;
  profileMaxDaily: string;
  profileRequiresApproval: boolean | null;
  profileCanOvertime: boolean | null;
  profileDepartment: string;
  profileJobTitle: string;
  profileStartDate: string;
  profileEndDate: string;
  profileHasEquity: boolean;
  profileEquityPercentage: string;
  profileRequiredEquityWeekly: string;
  profileRequiredEquityMonthly: string;
  profileMaxEquityWeekly: string;
  profileEquityHourlyValue: string;
  profileEquityNotes: string;
  profileIsActive: boolean;
}) {
  return {
    userId: formData.userId,
    employmentType: formData.profileType,
    maxHoursPerWeek: parseOptionalNumber(formData.profileMaxWeekly),
    maxHoursPerDay: parseOptionalNumber(formData.profileMaxDaily),
    requiresApproval: formData.profileRequiresApproval ?? undefined,
    canWorkOvertime: formData.profileCanOvertime ?? undefined,
    department: formData.profileDepartment || undefined,
    jobTitle: formData.profileJobTitle || undefined,
    startDate: parseOptionalDate(formData.profileStartDate),
    endDate: parseOptionalDate(formData.profileEndDate),
    hasEquity: formData.profileHasEquity || undefined,
    equityPercentage: parseOptionalNumber(formData.profileEquityPercentage),
    requiredEquityHoursPerWeek: parseOptionalNumber(formData.profileRequiredEquityWeekly),
    requiredEquityHoursPerMonth: parseOptionalNumber(formData.profileRequiredEquityMonthly),
    maxEquityHoursPerWeek: parseOptionalNumber(formData.profileMaxEquityWeekly),
    equityHourlyValue: parseOptionalNumber(formData.profileEquityHourlyValue),
    equityNotes: formData.profileEquityNotes || undefined,
    isActive: formData.profileIsActive,
  };
}

// Helper: Extract form state from profile for editing
function extractFormStateFromProfile(profile: UserProfileWithUser) {
  return {
    profileType: profile.employmentType,
    profileMaxWeekly: profile.maxHoursPerWeek?.toString() || "",
    profileMaxDaily: profile.maxHoursPerDay?.toString() || "",
    profileRequiresApproval: profile.requiresApproval ?? null,
    profileCanOvertime: profile.canWorkOvertime ?? null,
    profileDepartment: profile.department || "",
    profileJobTitle: profile.jobTitle || "",
    profileStartDate: profile.startDate
      ? new Date(profile.startDate).toISOString().split("T")[0]
      : "",
    profileEndDate: profile.endDate ? new Date(profile.endDate).toISOString().split("T")[0] : "",
    profileIsActive: profile.isActive,
    profileHasEquity: profile.hasEquity ?? false,
    profileEquityPercentage: profile.equityPercentage?.toString() || "",
    profileRequiredEquityWeekly: profile.requiredEquityHoursPerWeek?.toString() || "",
    profileRequiredEquityMonthly: profile.requiredEquityHoursPerMonth?.toString() || "",
    profileMaxEquityWeekly: profile.maxEquityHoursPerWeek?.toString() || "",
    profileEquityHourlyValue: profile.equityHourlyValue?.toString() || "",
    profileEquityNotes: profile.equityNotes || "",
  };
}

export function UserTypeManager() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedType, setSelectedType] = useState<EmploymentType>("employee");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Employment type configs
  const configs = useQuery(api.userProfiles.getEmploymentTypeConfigs);
  const updateConfig = useMutation(api.userProfiles.updateEmploymentTypeConfig);
  const initConfigs = useMutation(api.userProfiles.initializeEmploymentTypes);

  // User profiles
  const profiles = useQuery(api.userProfiles.listUserProfiles, {});
  const usersWithoutProfiles = useQuery(api.userProfiles.getUsersWithoutProfiles);
  const upsertProfile = useMutation(api.userProfiles.upsertUserProfile);
  const deleteProfile = useMutation(api.userProfiles.deleteUserProfile);

  // Config form state
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [configMaxWeekly, setConfigMaxWeekly] = useState(40);
  const [configMaxDaily, setConfigMaxDaily] = useState(8);
  const [configRequiresApproval, setConfigRequiresApproval] = useState(false);
  const [configCanOvertime, setConfigCanOvertime] = useState(true);
  const [configCanBilling, setConfigCanBilling] = useState(true);
  const [configCanManageProjects, setConfigCanManageProjects] = useState(true);

  // User profile form state
  const [profileType, setProfileType] = useState<EmploymentType>("employee");
  const [profileMaxWeekly, setProfileMaxWeekly] = useState<string>("");
  const [profileMaxDaily, setProfileMaxDaily] = useState<string>("");
  const [profileRequiresApproval, setProfileRequiresApproval] = useState<boolean | null>(null);
  const [profileCanOvertime, setProfileCanOvertime] = useState<boolean | null>(null);
  const [profileDepartment, setProfileDepartment] = useState("");
  const [profileJobTitle, setProfileJobTitle] = useState("");
  const [profileStartDate, setProfileStartDate] = useState("");
  const [profileEndDate, setProfileEndDate] = useState("");
  const [profileIsActive, setProfileIsActive] = useState(true);
  // Equity state
  const [profileHasEquity, setProfileHasEquity] = useState(false);
  const [profileEquityPercentage, setProfileEquityPercentage] = useState<string>("");
  const [profileRequiredEquityWeekly, setProfileRequiredEquityWeekly] = useState<string>("");
  const [profileRequiredEquityMonthly, setProfileRequiredEquityMonthly] = useState<string>("");
  const [profileMaxEquityWeekly, setProfileMaxEquityWeekly] = useState<string>("");
  const [profileEquityHourlyValue, setProfileEquityHourlyValue] = useState<string>("");
  const [profileEquityNotes, setProfileEquityNotes] = useState("");

  const handleInitializeConfigs = async () => {
    try {
      await initConfigs({});
      showSuccess("Employment type configurations initialized");
    } catch (error) {
      showError(error, "Failed to initialize configurations");
    }
  };

  const handleEditConfig = (type: EmploymentType) => {
    const config = configs?.find((c) => c.type === type);
    if (!config) return;

    setSelectedType(type);
    setConfigName(config.name);
    setConfigDescription(config.description || "");
    setConfigMaxWeekly(config.defaultMaxHoursPerWeek);
    setConfigMaxDaily(config.defaultMaxHoursPerDay);
    setConfigRequiresApproval(config.defaultRequiresApproval);
    setConfigCanOvertime(config.defaultCanWorkOvertime);
    setConfigCanBilling(config.canAccessBilling);
    setConfigCanManageProjects(config.canManageProjects);
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateConfig({
        type: selectedType,
        name: configName,
        description: configDescription || undefined,
        defaultMaxHoursPerWeek: configMaxWeekly,
        defaultMaxHoursPerDay: configMaxDaily,
        defaultRequiresApproval: configRequiresApproval,
        defaultCanWorkOvertime: configCanOvertime,
        canAccessBilling: configCanBilling,
        canManageProjects: configCanManageProjects,
      });
      showSuccess("Configuration updated");
      setShowConfigModal(false);
    } catch (error) {
      showError(error, "Failed to update configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignUser = (userId: Id<"users">) => {
    setSelectedUserId(userId);
    setProfileType("employee");
    setProfileMaxWeekly("");
    setProfileMaxDaily("");
    setProfileRequiresApproval(null);
    setProfileCanOvertime(null);
    setProfileDepartment("");
    setProfileJobTitle("");
    setProfileStartDate("");
    setProfileEndDate("");
    setProfileIsActive(true);
    setProfileHasEquity(false);
    setProfileEquityPercentage("");
    setProfileRequiredEquityWeekly("");
    setProfileRequiredEquityMonthly("");
    setProfileMaxEquityWeekly("");
    setProfileEquityHourlyValue("");
    setProfileEquityNotes("");
    setShowAssignModal(true);
  };

  const handleEditProfile = (profile: UserProfileWithUser) => {
    setSelectedUserId(profile.userId);
    const formState = extractFormStateFromProfile(profile);
    setProfileType(formState.profileType);
    setProfileMaxWeekly(formState.profileMaxWeekly);
    setProfileMaxDaily(formState.profileMaxDaily);
    setProfileRequiresApproval(formState.profileRequiresApproval);
    setProfileCanOvertime(formState.profileCanOvertime);
    setProfileDepartment(formState.profileDepartment);
    setProfileJobTitle(formState.profileJobTitle);
    setProfileStartDate(formState.profileStartDate);
    setProfileEndDate(formState.profileEndDate);
    setProfileIsActive(formState.profileIsActive);
    setProfileHasEquity(formState.profileHasEquity);
    setProfileEquityPercentage(formState.profileEquityPercentage);
    setProfileRequiredEquityWeekly(formState.profileRequiredEquityWeekly);
    setProfileRequiredEquityMonthly(formState.profileRequiredEquityMonthly);
    setProfileMaxEquityWeekly(formState.profileMaxEquityWeekly);
    setProfileEquityHourlyValue(formState.profileEquityHourlyValue);
    setProfileEquityNotes(formState.profileEquityNotes);
    setShowAssignModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      const profileData = buildProfileData({
        userId: selectedUserId,
        profileType,
        profileMaxWeekly,
        profileMaxDaily,
        profileRequiresApproval,
        profileCanOvertime,
        profileDepartment,
        profileJobTitle,
        profileStartDate,
        profileEndDate,
        profileHasEquity,
        profileEquityPercentage,
        profileRequiredEquityWeekly,
        profileRequiredEquityMonthly,
        profileMaxEquityWeekly,
        profileEquityHourlyValue,
        profileEquityNotes,
        profileIsActive,
      });

      await upsertProfile(profileData);
      showSuccess("User profile saved");
      setShowAssignModal(false);
      setSelectedUserId(null);
    } catch (error) {
      showError(error, "Failed to save user profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfile = async (userId: Id<"users">) => {
    if (!confirm("Remove employment type assignment for this user?")) return;

    try {
      await deleteProfile({ userId });
      showSuccess("User profile removed");
    } catch (error) {
      showError(error, "Failed to remove user profile");
    }
  };

  const getTypeIcon = (type: EmploymentType) => {
    switch (type) {
      case "employee":
        return "👔";
      case "contractor":
        return "🔧";
      case "intern":
        return "🎓";
    }
  };

  const getTypeColor = (type: EmploymentType) => {
    switch (type) {
      case "employee":
        return "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300";
      case "contractor":
        return "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300";
      case "intern":
        return "bg-status-success-bg text-status-success-text dark:bg-status-success-bg-dark dark:text-status-success-text-dark";
    }
  };

  return (
    <Flex direction="column" gap="xl">
      {/* Employment Type Configurations */}
      <Card>
        <CardHeader
          title="Employment Type Configurations"
          description="Default settings for each employment type"
          action={
            !configs || configs.length === 0 ? (
              <Button onClick={handleInitializeConfigs}>Initialize Defaults</Button>
            ) : undefined
          }
        />
        <CardBody>
          {!configs ? (
            <div className="text-center py-8 text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              Loading...
            </div>
          ) : configs.length === 0 ? (
            <EmptyState
              icon="⚙️"
              title="No configurations"
              description="Initialize default employment type configurations"
              action={{
                label: "Initialize Now",
                onClick: handleInitializeConfigs,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {configs.map((config) => (
                <div
                  key={config.type}
                  className="p-4 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg hover:shadow-md transition-shadow"
                >
                  <Flex justify="between" align="start" className="mb-3">
                    <Flex align="center" gap="sm">
                      <span className="text-2xl">{getTypeIcon(config.type)}</span>
                      <div>
                        <h3 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                          {config.name}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded capitalize ${getTypeColor(config.type)}`}
                        >
                          {config.type}
                        </span>
                      </div>
                    </Flex>
                  </Flex>

                  {config.description && (
                    <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-3">
                      {config.description}
                    </p>
                  )}

                  <Flex direction="column" gap="sm" className="text-sm">
                    <Flex justify="between">
                      <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        Max hours/week:
                      </span>
                      <span className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        {config.defaultMaxHoursPerWeek}h
                      </span>
                    </Flex>
                    <Flex justify="between">
                      <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        Max hours/day:
                      </span>
                      <span className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        {config.defaultMaxHoursPerDay}h
                      </span>
                    </Flex>
                    <Flex justify="between">
                      <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        Requires approval:
                      </span>
                      <span className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        {config.defaultRequiresApproval ? "Yes" : "No"}
                      </span>
                    </Flex>
                    <Flex justify="between">
                      <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        Can work overtime:
                      </span>
                      <span className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        {config.defaultCanWorkOvertime ? "Yes" : "No"}
                      </span>
                    </Flex>
                  </Flex>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditConfig(config.type)}
                    className="w-full mt-4"
                  >
                    Edit Configuration
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* User Assignments */}
      <Card>
        <CardHeader
          title="User Employment Assignments"
          description="Assign employment types to users"
        />
        <CardBody>
          {/* Users without profiles */}
          {usersWithoutProfiles && usersWithoutProfiles.length > 0 && (
            <div className="mb-6 p-4 bg-status-warning-bg dark:bg-status-warning-bg-dark border border-status-warning dark:border-status-warning rounded-lg">
              <h4 className="font-semibold text-status-warning-text dark:text-status-warning-text-dark mb-2">
                Unassigned Users ({usersWithoutProfiles.length})
              </h4>
              <Flex direction="column" gap="sm">
                {usersWithoutProfiles.slice(0, 5).map((user) => (
                  <Flex
                    key={user._id}
                    justify="between"
                    align="center"
                    className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark p-2 rounded"
                  >
                    <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark">
                      {user.name || user.email || "Unknown User"}
                    </span>
                    <Button size="sm" onClick={() => handleAssignUser(user._id)}>
                      Assign Type
                    </Button>
                  </Flex>
                ))}
                {usersWithoutProfiles.length > 5 && (
                  <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                    +{usersWithoutProfiles.length - 5} more...
                  </p>
                )}
              </Flex>
            </div>
          )}

          {/* Assigned users */}
          {!profiles ? (
            <div className="text-center py-8 text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              Loading...
            </div>
          ) : profiles.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No user assignments"
              description="Assign employment types to users to get started"
            />
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div
                  key={profile._id}
                  className="p-4 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors"
                >
                  <Flex justify="between" align="start">
                    <div className="flex-1">
                      <Flex gap="md" align="center" className="mb-2">
                        <span className="text-xl">{getTypeIcon(profile.employmentType)}</span>
                        <div>
                          <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                            {profile.user?.name || profile.user?.email || "Unknown User"}
                          </h4>
                          <Flex gap="sm" className="mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded capitalize ${getTypeColor(profile.employmentType)}`}
                            >
                              {profile.employmentType}
                            </span>
                            {!profile.isActive && (
                              <span className="text-xs px-2 py-0.5 bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark rounded">
                                Inactive
                              </span>
                            )}
                          </Flex>
                        </div>
                      </Flex>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                        {profile.jobTitle && (
                          <div>
                            <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark text-xs">
                              Job Title:
                            </span>
                            <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                              {profile.jobTitle}
                            </div>
                          </div>
                        )}
                        {profile.department && (
                          <div>
                            <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark text-xs">
                              Department:
                            </span>
                            <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                              {profile.department}
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark text-xs">
                            Max hours/week:
                          </span>
                          <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                            {profile.maxHoursPerWeek || "Default"}
                          </div>
                        </div>
                        <div>
                          <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark text-xs">
                            Max hours/day:
                          </span>
                          <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                            {profile.maxHoursPerDay || "Default"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Flex gap="sm" className="ml-4">
                      <Button variant="ghost" size="sm" onClick={() => handleEditProfile(profile)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProfile(profile.userId)}
                      >
                        Remove
                      </Button>
                    </Flex>
                  </Flex>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit Config Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {selectedType} Configuration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveConfig} className="p-6">
            <Flex direction="column" gap="lg">
              <Input
                label="Display Name"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                required
              />

              <Input
                label="Description"
                value={configDescription}
                onChange={(e) => setConfigDescription(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max Hours per Week"
                  type="number"
                  value={configMaxWeekly}
                  onChange={(e) => setConfigMaxWeekly(Number(e.target.value))}
                  min={1}
                  max={168}
                  required
                />

                <Input
                  label="Max Hours per Day"
                  type="number"
                  value={configMaxDaily}
                  onChange={(e) => setConfigMaxDaily(Number(e.target.value))}
                  min={1}
                  max={24}
                  required
                />
              </div>

              <Flex direction="column" gap="md">
                <label>
                  <Flex align="center" gap="sm">
                    <input
                      type="checkbox"
                      checked={configRequiresApproval}
                      onChange={(e) => setConfigRequiresApproval(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Requires manager approval for time entries</span>
                  </Flex>
                </label>

                <label>
                  <Flex align="center" gap="sm">
                    <input
                      type="checkbox"
                      checked={configCanOvertime}
                      onChange={(e) => setConfigCanOvertime(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Can work overtime hours</span>
                  </Flex>
                </label>

                <label>
                  <Flex align="center" gap="sm">
                    <input
                      type="checkbox"
                      checked={configCanBilling}
                      onChange={(e) => setConfigCanBilling(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Can access billing information</span>
                  </Flex>
                </label>

                <label>
                  <Flex align="center" gap="sm">
                    <input
                      type="checkbox"
                      checked={configCanManageProjects}
                      onChange={(e) => setConfigCanManageProjects(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Can manage projects</span>
                  </Flex>
                </label>
              </Flex>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowConfigModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save Configuration
                </Button>
              </DialogFooter>
            </Flex>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign/Edit User Modal */}
      <Dialog
        open={showAssignModal}
        onOpenChange={(open) => {
          setShowAssignModal(open);
          if (!open) {
            setSelectedUserId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUserId ? "Edit User Employment" : "Assign Employment Type"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="p-6">
            <Flex direction="column" gap="lg">
              <Select
                label="Employment Type"
                value={profileType}
                onChange={(e) => setProfileType(e.target.value as EmploymentType)}
                required
              >
                <option value="employee">Employee</option>
                <option value="contractor">Contractor</option>
                <option value="intern">Intern</option>
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Job Title"
                  value={profileJobTitle}
                  onChange={(e) => setProfileJobTitle(e.target.value)}
                  placeholder="e.g., Senior Developer"
                />

                <Input
                  label="Department"
                  value={profileDepartment}
                  onChange={(e) => setProfileDepartment(e.target.value)}
                  placeholder="e.g., Engineering"
                />
              </div>

              <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
                <h4 className="font-medium text-sm mb-3 text-ui-text-primary dark:text-ui-text-primary-dark">
                  Hour Overrides (leave empty to use type defaults)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Max Hours per Week"
                    type="number"
                    value={profileMaxWeekly}
                    onChange={(e) => setProfileMaxWeekly(e.target.value)}
                    placeholder="Default"
                    min={1}
                    max={168}
                  />

                  <Input
                    label="Max Hours per Day"
                    type="number"
                    value={profileMaxDaily}
                    onChange={(e) => setProfileMaxDaily(e.target.value)}
                    placeholder="Default"
                    min={1}
                    max={24}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={profileStartDate}
                  onChange={(e) => setProfileStartDate(e.target.value)}
                />

                <Input
                  label="End Date (Optional)"
                  type="date"
                  value={profileEndDate}
                  onChange={(e) => setProfileEndDate(e.target.value)}
                />
              </div>

              {/* Equity Compensation Section (Employees Only) */}
              {profileType === "employee" && (
                <div className="p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
                  <Flex justify="between" align="center" className="mb-3">
                    <h4 className="font-medium text-sm text-brand-900 dark:text-brand-100">
                      💎 Equity Compensation
                    </h4>
                    <label>
                      <Flex align="center" gap="sm">
                        <input
                          type="checkbox"
                          checked={profileHasEquity}
                          onChange={(e) => setProfileHasEquity(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-xs font-medium text-brand-900 dark:text-brand-100">
                          Has Equity
                        </span>
                      </Flex>
                    </label>
                  </Flex>

                  {profileHasEquity && (
                    <Flex direction="column" gap="lg">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Equity Percentage (%)"
                          type="number"
                          value={profileEquityPercentage}
                          onChange={(e) => setProfileEquityPercentage(e.target.value)}
                          placeholder="e.g., 0.5 for 0.5%"
                          step="0.001"
                          min={0}
                        />

                        <Input
                          label="Equity Hour Value ($)"
                          type="number"
                          value={profileEquityHourlyValue}
                          onChange={(e) => setProfileEquityHourlyValue(e.target.value)}
                          placeholder="Est. value per hour"
                          step="0.01"
                          min={0}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          label="Required Hours/Week"
                          type="number"
                          value={profileRequiredEquityWeekly}
                          onChange={(e) => setProfileRequiredEquityWeekly(e.target.value)}
                          placeholder="e.g., 10"
                          min={0}
                          max={168}
                        />

                        <Input
                          label="Required Hours/Month"
                          type="number"
                          value={profileRequiredEquityMonthly}
                          onChange={(e) => setProfileRequiredEquityMonthly(e.target.value)}
                          placeholder="e.g., 40"
                          min={0}
                        />

                        <Input
                          label="Max Equity Hours/Week"
                          type="number"
                          value={profileMaxEquityWeekly}
                          onChange={(e) => setProfileMaxEquityWeekly(e.target.value)}
                          placeholder="e.g., 20"
                          min={0}
                          max={168}
                        />
                      </div>

                      <Textarea
                        label="Equity Notes"
                        value={profileEquityNotes}
                        onChange={(e) => setProfileEquityNotes(e.target.value)}
                        placeholder="Additional notes about equity arrangement..."
                        rows={2}
                      />

                      <div className="text-xs text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/40 p-2 rounded">
                        💡 Tip: Equity hours are non-paid hours compensated with equity. Set
                        required hours/week OR hours/month (not both). Max hours/week prevents
                        overwork.
                      </div>
                    </Flex>
                  )}
                </div>
              )}

              <Flex direction="column" gap="md">
                <label>
                  <Flex align="center" gap="sm">
                    <input
                      type="checkbox"
                      checked={profileIsActive}
                      onChange={(e) => setProfileIsActive(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Active Employment</span>
                  </Flex>
                </label>
              </Flex>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUserId(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save Profile
                </Button>
              </DialogFooter>
            </Flex>
          </form>
        </DialogContent>
      </Dialog>
    </Flex>
  );
}
