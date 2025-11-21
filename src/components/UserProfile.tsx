import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { InputField } from "./ui/InputField";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Modal } from "./ui/Modal";

interface UserProfileProps {
  userId?: Id<"users">;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ userId, isOpen, onClose }: UserProfileProps) {
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

  if (!viewUser) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile" size="large">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            {viewUser.image ? (
              <img
                src={viewUser.image}
                alt={viewUser.name || "User"}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-600 text-white flex items-center justify-center text-3xl font-bold">
                {(viewUser.name || viewUser.email || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <InputField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                <InputField
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  type="email"
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
                  {viewUser.name || "Anonymous User"}
                </h2>
                <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  {viewUser.email}
                </p>
                {isOwnProfile && (
                  <Button onClick={handleEdit} variant="secondary" size="sm" className="mt-3">
                    Edit Profile
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {userStats.projects}
              </div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Projects
              </div>
            </div>
            <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {userStats.issuesCreated}
              </div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Created
              </div>
            </div>
            <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {userStats.issuesAssigned}
              </div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Assigned
              </div>
            </div>
            <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {userStats.issuesCompleted}
              </div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Completed
              </div>
            </div>
            <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {userStats.comments}
              </div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Comments
              </div>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-6">
          <h3 className="text-lg font-semibold mb-4 text-ui-text-primary dark:text-ui-text-primary-dark">
            Account Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                User ID:
              </span>
              <span className="font-mono text-ui-text-primary dark:text-ui-text-primary-dark">
                {viewUser._id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Email Verified:
              </span>
              <span className="text-ui-text-primary dark:text-ui-text-primary-dark">
                {viewUser.emailVerificationTime ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {isEditing ? (
            <>
              <Button onClick={() => setIsEditing(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
