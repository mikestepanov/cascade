import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Flex } from "../ui/Flex";
import { Input, Select } from "../ui/form";
import { Typography } from "../ui/Typography";

interface Member {
  _id: Id<"users">;
  name: string;
  email: string | undefined;
  image: string | undefined;
  role: "admin" | "editor" | "viewer";
  addedAt: number;
}

interface MemberManagementProps {
  projectId: Id<"projects">;
  members: Member[];
  createdBy: Id<"users">;
  ownerId: Id<"users"> | undefined;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const ROLE_BADGE_VARIANTS: Record<string, "brand" | "secondary" | "neutral"> = {
  admin: "brand",
  editor: "secondary",
  viewer: "neutral",
};

export function MemberManagement({
  projectId,
  members,
  createdBy,
  ownerId,
}: MemberManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [isAdding, setIsAdding] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [changingRoleFor, setChangingRoleFor] = useState<Id<"users"> | null>(null);

  const addMember = useMutation(api.projects.addProjectMember);
  const updateMemberRole = useMutation(api.projects.updateProjectMemberRole);
  const removeMember = useMutation(api.projects.removeProjectMember);

  const handleAddMember = async () => {
    if (!email.trim()) {
      showError(new Error("Email is required"), "Validation error");
      return;
    }

    setIsAdding(true);
    try {
      await addMember({
        projectId,
        userEmail: email.trim(),
        role,
      });
      showSuccess("Member added successfully");
      setEmail("");
      setRole("editor");
      setShowAddForm(false);
    } catch (error) {
      showError(error, "Failed to add member");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRoleChange = async (
    memberId: Id<"users">,
    newRole: "admin" | "editor" | "viewer",
  ) => {
    setChangingRoleFor(memberId);
    try {
      await updateMemberRole({
        projectId,
        memberId,
        newRole,
      });
      showSuccess("Role updated");
    } catch (error) {
      showError(error, "Failed to update role");
    } finally {
      setChangingRoleFor(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember({
        projectId,
        memberId: memberToRemove._id,
      });
      showSuccess("Member removed");
      setMemberToRemove(null);
    } catch (error) {
      showError(error, "Failed to remove member");
      setMemberToRemove(null);
    }
  };

  const isOwner = (memberId: Id<"users">) => {
    return memberId === createdBy || memberId === ownerId;
  };

  return (
    <>
      <Card variant="soft">
        <div className="p-6">
          <Flex justify="between" align="center" className="mb-6">
            <div>
              <Typography variant="large" className="font-semibold tracking-tight">
                Members
              </Typography>
              <Typography variant="small" color="secondary" className="mt-0.5">
                {members.length} member{members.length !== 1 ? "s" : ""} with access
              </Typography>
            </div>
            {!showAddForm && (
              <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>
                Add Member
              </Button>
            )}
          </Flex>

          {showAddForm && (
            <div className="mb-6 p-5 bg-ui-bg-tertiary rounded-lg border border-ui-border">
              <Typography variant="small" className="mb-4 font-semibold">
                Add New Member
              </Typography>
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
                <Select
                  label="Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "editor" | "viewer")}
                  options={ROLE_OPTIONS}
                />
                <Flex gap="sm" className="pt-1">
                  <Button
                    onClick={handleAddMember}
                    disabled={isAdding}
                    size="sm"
                    isLoading={isAdding}
                  >
                    Add Member
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setEmail("");
                      setRole("editor");
                    }}
                    disabled={isAdding}
                  >
                    Cancel
                  </Button>
                </Flex>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {members.map((member) => (
              <Flex
                align="center"
                justify="between"
                className="p-3 bg-ui-bg-tertiary rounded-lg transition-default hover:bg-ui-bg-hover"
                key={member._id}
              >
                <Flex gap="md" align="center">
                  <Avatar src={member.image} name={member.name} email={member.email} size="sm" />
                  <div>
                    <Flex gap="sm" align="center">
                      <Typography variant="small" className="font-medium text-ui-text">
                        {member.name}
                      </Typography>
                      {isOwner(member._id) && (
                        <Badge variant="primary" size="sm">
                          Owner
                        </Badge>
                      )}
                    </Flex>
                    <Typography variant="small" color="secondary">
                      {member.email || "No email"}
                    </Typography>
                  </div>
                </Flex>

                <Flex gap="sm" align="center">
                  {isOwner(member._id) ? (
                    <Badge variant={ROLE_BADGE_VARIANTS[member.role]} size="sm">
                      {member.role}
                    </Badge>
                  ) : (
                    <>
                      <Select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member._id,
                            e.target.value as "admin" | "editor" | "viewer",
                          )
                        }
                        options={ROLE_OPTIONS}
                        disabled={changingRoleFor === member._id}
                        className="w-28"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member)}
                        className="text-status-error hover:text-status-error hover:bg-status-error/10"
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </Flex>
              </Flex>
            ))}
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        title="Remove Member"
        confirmLabel="Remove"
        onConfirm={handleRemoveMember}
        variant="danger"
        message={`Are you sure you want to remove ${memberToRemove?.name} from this project? They will lose access to all project resources.`}
      />
    </>
  );
}
