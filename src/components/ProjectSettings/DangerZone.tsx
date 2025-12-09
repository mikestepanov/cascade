import { useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/form";
import { Flex } from "../ui/Flex";
import { ROUTES } from "@/config/routes";

interface DangerZoneProps {
  projectId: Id<"projects">;
  projectName: string;
  projectKey: string;
  isOwner: boolean;
  companySlug: string;
}

export function DangerZone({
  projectId,
  projectName,
  projectKey,
  isOwner,
  companySlug,
}: DangerZoneProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const deleteProject = useMutation(api.projects.deleteProject);

  const handleDelete = async () => {
    if (confirmText !== projectKey) {
      showError(new Error("Please type the project key to confirm"), "Confirmation required");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProject({ projectId });
      showSuccess("Project deleted successfully");
      navigate({ to: ROUTES.projects.list(companySlug) });
    } catch (error) {
      showError(error, "Failed to delete project");
      setIsDeleting(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Card className="border-status-error/50">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-status-error mb-2">Danger Zone</h3>
        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
          Irreversible actions that affect the entire project
        </p>

        <div className="p-4 bg-status-error/5 border border-status-error/20 rounded-lg">
          <Flex justify="between" align="start">
            <div className="flex-1">
              <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                Delete this project
              </h4>
              <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
                Once you delete a project, there is no going back. This will permanently delete the
                project "{projectName}" and all its issues, sprints, and data.
              </p>
            </div>
            {!showConfirm && (
              <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
                Delete Project
              </Button>
            )}
          </Flex>

          {showConfirm && (
            <div className="mt-4 pt-4 border-t border-status-error/20">
              <p className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
                To confirm, type <strong className="font-mono">{projectKey}</strong> below:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type ${projectKey} to confirm`}
                className="mb-3"
              />
              <Flex gap="sm">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={confirmText !== projectKey || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "I understand, delete this project"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </Flex>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
