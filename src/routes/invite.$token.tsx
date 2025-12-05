import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { showError, showSuccess } from "@/lib/toast";
import { SignInForm } from "@/SignInForm";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/invite/$token")({
  component: InviteRoute,
  ssr: false, // No SSR needed for invite page
});

function InviteRoute() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Get invite details
  const invite = useQuery(api.invites.getInviteByToken, { token });
  const acceptInvite = useMutation(api.invites.acceptInvite);

  const goToHome = () => {
    navigate({ to: "/" });
  };

  const handleAcceptInvite = async () => {
    setIsAccepting(true);
    setAcceptError(null);
    try {
      const result = await acceptInvite({ token });
      const successMessage = result.projectId
        ? "Welcome! You've joined the project."
        : "Welcome! You've joined the team.";
      showSuccess(successMessage);
      navigate({ to: "/dashboard" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept invite";
      setAcceptError(message);
      showError(error, "Failed to accept invite");
    } finally {
      setIsAccepting(false);
    }
  };

  // Loading state
  if (invite === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
            Loading invitation...
          </p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (invite === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark p-6">
        <div className="max-w-md w-full text-center">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 w-fit mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Invalid Invitation
          </h1>
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-6">
            This invitation link is invalid or has been removed. Please contact the person who
            invited you for a new link.
          </p>
          <Button variant="primary" onClick={goToHome}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Expired invite (isExpired is computed from status === "pending" && expiresAt < now)
  if (invite.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark p-6">
        <div className="max-w-md w-full text-center">
          <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 w-fit mx-auto mb-6">
            <Clock className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Invitation Expired
          </h1>
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-6">
            This invitation has expired. Please contact{" "}
            <span className="font-medium">{invite.inviterName}</span> to send a new invitation.
          </p>
          <Button variant="primary" onClick={goToHome}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Already accepted
  if (invite.status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark p-6">
        <div className="max-w-md w-full text-center">
          <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Already Accepted
          </h1>
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-6">
            This invitation has already been accepted. You can sign in to access your account.
          </p>
          <Button variant="primary" onClick={goToHome}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Revoked invite
  if (invite.status === "revoked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark p-6">
        <div className="max-w-md w-full text-center">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 w-fit mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Invitation Revoked
          </h1>
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-6">
            This invitation has been revoked. Please contact the team administrator if you believe
            this is a mistake.
          </p>
          <Button variant="primary" onClick={goToHome}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Determine if this is a project invite
  const isProjectInvite = !!invite.projectId;

  // Valid pending invite - show different UI based on auth state
  return (
    <div className="min-h-screen flex flex-col bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
      {/* Header */}
      <header className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-lg text-ui-text-primary dark:text-ui-text-primary-dark">
            Nixelo
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Invitation Card */}
          <div className="bg-ui-bg-primary dark:bg-ui-bg-secondary-dark rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
                You're Invited!
              </h1>
              <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                <span className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  {invite.inviterName}
                </span>{" "}
                {isProjectInvite ? (
                  <>
                    has invited you to join the project{" "}
                    <span className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                      {invite.projectName}
                    </span>
                  </>
                ) : (
                  "has invited you to join Nixelo"
                )}
              </p>
            </div>

            {/* Invite Details */}
            <div className="bg-ui-bg-secondary dark:bg-ui-bg-primary-dark rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                  Invited email
                </span>
                <span className="text-ui-text-primary dark:text-ui-text-primary-dark font-medium">
                  {invite.email}
                </span>
              </div>
              {isProjectInvite ? (
                <>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                      Project
                    </span>
                    <span className="text-ui-text-primary dark:text-ui-text-primary-dark font-medium">
                      {invite.projectName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                      Project Role
                    </span>
                    <span className="text-ui-text-primary dark:text-ui-text-primary-dark font-medium capitalize">
                      {invite.projectRole || "editor"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                    Role
                  </span>
                  <span className="text-ui-text-primary dark:text-ui-text-primary-dark font-medium capitalize">
                    {invite.role}
                  </span>
                </div>
              )}
            </div>

            {/* Auth-dependent content */}
            <Authenticated>
              {/* User is logged in - show accept button */}
              <div className="space-y-4">
                {acceptError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                    {acceptError}
                  </div>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleAcceptInvite}
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Accepting...
                    </>
                  ) : (
                    "Accept Invitation"
                  )}
                </Button>
                <p className="text-xs text-center text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                  By accepting, you'll join the team and can start collaborating
                </p>
              </div>
            </Authenticated>

            <Unauthenticated>
              {/* User is not logged in - show sign up/in form */}
              <div className="space-y-4">
                <p className="text-sm text-center text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
                  Sign in or create an account with{" "}
                  <span className="font-medium">{invite.email}</span> to accept this invitation
                </p>
                <SignInForm />
              </div>
            </Unauthenticated>
          </div>
        </div>
      </main>
    </div>
  );
}
