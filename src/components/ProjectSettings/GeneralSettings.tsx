import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Input, Textarea } from "../ui/form";
import { Typography } from "../ui/Typography";

interface GeneralSettingsProps {
  projectId: Id<"projects">;
  name: string;
  projectKey: string;
  description: string | undefined;
}

export function GeneralSettings({
  projectId,
  name,
  projectKey,
  description,
}: GeneralSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editDescription, setEditDescription] = useState(description || "");
  const [isSaving, setIsSaving] = useState(false);

  const updateProject = useMutation(api.projects.update);

  const handleEdit = () => {
    setEditName(name);
    setEditDescription(description || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      showError(new Error("Project name is required"), "Validation error");
      return;
    }

    setIsSaving(true);
    try {
      await updateProject({
        projectId,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      showSuccess("Project settings updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <Flex justify="between" align="center" className="mb-4">
          <Typography variant="large">General</Typography>
          {!isEditing && (
            <Button variant="secondary" size="sm" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </Flex>

        {isEditing ? (
          <div className="space-y-4">
            <Input
              label="Project Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter project name"
            />
            <div>
              <Typography variant="small" color="secondary" className="block mb-1">
                Project Key
              </Typography>
              <Typography
                variant="muted"
                className="font-mono bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark px-3 py-2 rounded block"
              >
                {projectKey}
              </Typography>
              <Typography variant="muted" className="mt-1 text-xs">
                Project key cannot be changed after creation
              </Typography>
            </div>
            <Textarea
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
            <Flex gap="sm">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
            </Flex>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Typography variant="small" color="secondary" className="block mb-1">
                Project Name
              </Typography>
              <Typography variant="p" className="mt-0">
                {name}
              </Typography>
            </div>
            <div>
              <Typography variant="small" color="secondary" className="block mb-1">
                Project Key
              </Typography>
              <Typography variant="p" className="mt-0 font-mono">
                {projectKey}
              </Typography>
            </div>
            <div>
              <Typography variant="small" color="secondary" className="block mb-1">
                Description
              </Typography>
              <Typography variant="p" className="mt-0">
                {description || "No description"}
              </Typography>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
