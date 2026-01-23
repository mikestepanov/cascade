import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/form";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Typography } from "../ui/Typography";

interface UserStats {
  projects: number;
  issuesCreated: number;
  issuesAssigned: number;
  issuesCompleted: number;
  comments: number;
}

/**
 * User stats cards component
 */
export function UserStatsCards({ stats }: { stats: UserStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
          {stats.projects}
        </div>
        <div className="text-sm text-ui-text-secondary">Workspaces</div>
      </div>
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
          {stats.issuesCreated}
        </div>
        <div className="text-sm text-ui-text-secondary">Created</div>
      </div>
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
          {stats.issuesAssigned}
        </div>
        <div className="text-sm text-ui-text-secondary">Assigned</div>
      </div>
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
          {stats.issuesCompleted}
        </div>
        <div className="text-sm text-ui-text-secondary">Completed</div>
      </div>
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
          {stats.comments}
        </div>
        <div className="text-sm text-ui-text-secondary">Comments</div>
      </div>
    </div>
  );
}

/**
 * User account information section
 */
export function AccountInfo({ user }: { user: Doc<"users"> }) {
  return (
    <div className="border-t border-ui-border-primary pt-6">
      <Typography variant="h3" className="text-lg font-semibold mb-4 text-ui-text-primary">
        Account Information
      </Typography>
      <div className="space-y-3 text-sm">
        <Flex justify="between">
          <span className="text-ui-text-secondary">User ID:</span>
          <span className="font-mono text-ui-text-primary">{user._id}</span>
        </Flex>
        <Flex justify="between">
          <span className="text-ui-text-secondary">Email Verified:</span>
          <span className="text-ui-text-primary">{user.emailVerificationTime ? "Yes" : "No"}</span>
        </Flex>
      </div>
    </div>
  );
}

/**
 * Profile header with avatar and user info
 */
export function ProfileHeader({
  user,
  isOwnProfile,
  isEditing,
  name,
  email,
  onEditClick,
  onNameChange,
  onEmailChange,
  onSave,
  onCancel,
}: {
  user: Doc<"users">;
  isOwnProfile: boolean;
  isEditing: boolean;
  name: string;
  email: string;
  onEditClick: () => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Flex align="center" gap="xl">
      {/* Avatar */}
      <div className="relative">
        {user.image ? (
          <img src={user.image} alt={user.name || "User"} className="w-24 h-24 rounded-full" />
        ) : (
          <Flex
            align="center"
            justify="center"
            className="w-24 h-24 rounded-full bg-brand-600 text-white text-3xl font-bold"
          >
            {(user.name || user.email || "?").charAt(0).toUpperCase()}
          </Flex>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              label="Name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="your.email@example.com"
              type="email"
            />
            <Flex gap="sm" className="mt-2">
              <Button onClick={onSave} size="sm">
                Save
              </Button>
              <Button onClick={onCancel} variant="secondary" size="sm">
                Cancel
              </Button>
            </Flex>
          </div>
        ) : (
          <>
            <Typography variant="h2" className="text-2xl font-bold text-ui-text-primary">
              {user.name || "Anonymous User"}
            </Typography>
            <Typography className="text-ui-text-secondary">{user.email}</Typography>
            {isOwnProfile && (
              <Button onClick={onEditClick} variant="secondary" size="sm" className="mt-3">
                Edit Profile
              </Button>
            )}
          </>
        )}
      </div>
    </Flex>
  );
}

interface ProfileContentProps {
  userId?: Id<"users">;
}

export function ProfileContent({ userId }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const currentUser = useQuery(api.users.getCurrent);
  const fetchedViewUser = useQuery(api.users.get, userId ? { id: userId } : "skip");
  const userStatsForUserId = useQuery(api.users.getUserStats, userId ? { userId } : "skip");
  const userStatsForCurrent = useQuery(
    api.users.getUserStats,
    !userId && currentUser ? { userId: currentUser._id } : "skip",
  );

  const viewUser = fetchedViewUser || currentUser;
  const userStats = userId ? userStatsForUserId : userStatsForCurrent;
  const updateProfile = useMutation(api.users.updateProfile);

  const isOwnProfile = !userId || (currentUser && userId === currentUser._id);

  const handleEdit = () => {
    if (viewUser) {
      setName(viewUser.name || "");
      setEmail(viewUser.email || "");
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        name: name || undefined,
        email: email || undefined,
      });
      showSuccess("Profile updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (!viewUser) {
    return (
      <Flex align="center" justify="center" className="py-8">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          // biome-ignore lint/suspicious/noExplicitAny: PublicUser vs Doc mismatch
          user={viewUser as any}
          isOwnProfile={!!isOwnProfile}
          isEditing={isEditing}
          name={name}
          email={email}
          onEditClick={handleEdit}
          onNameChange={setName}
          onEmailChange={setEmail}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        {/* Stats Cards */}
        {userStats && <UserStatsCards stats={userStats} />}

        {/* Account Info */}
        {/* biome-ignore lint/suspicious/noExplicitAny: missing property on narrowed type */}
        {viewUser && "_creationTime" in viewUser && <AccountInfo user={viewUser as any} />}
      </div>
    </Card>
  );
}
