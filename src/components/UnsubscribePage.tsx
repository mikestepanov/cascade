/**
 * Unsubscribe Page
 *
 * Allows users to unsubscribe from email notifications via one-click link
 */

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Typography } from "./ui/Typography";

interface UnsubscribePageProps {
  token: string;
}

export function UnsubscribePage({ token }: UnsubscribePageProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const getUserFromToken = useQuery(api.unsubscribe.getUserFromToken, { token });
  const unsubscribe = useMutation(api.unsubscribe.unsubscribe);

  useEffect(() => {
    // Check if token is valid
    if (getUserFromToken === undefined) {
      // Still loading
      return;
    }

    if (getUserFromToken === null) {
      // Invalid or expired token
      setStatus("invalid");
      return;
    }

    // Token is valid, proceed with unsubscribe
    const doUnsubscribe = async () => {
      try {
        await unsubscribe({ token });
        setStatus("success");
      } catch (error) {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      }
    };

    void doUnsubscribe();
  }, [getUserFromToken, token, unsubscribe]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
      <div className="max-w-md w-full bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-lg p-8">
        {status === "loading" && (
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <Typography variant="h4" as="h2" className="mb-2">
              Processing...
            </Typography>
            <Typography color="secondary">Unsubscribing you from email notifications</Typography>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-status-success-bg dark:bg-status-success-dark flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-status-success dark:text-status-success-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Success checkmark"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <Typography variant="h4" as="h2" className="mb-2">
              Successfully Unsubscribed
            </Typography>
            <Typography color="secondary" className="mb-6">
              You have been unsubscribed from all email notifications.
            </Typography>
            <Typography variant="muted">
              You can update your notification preferences anytime by logging into your account.
            </Typography>
          </div>
        )}

        {status === "invalid" && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-status-warning-bg dark:bg-status-warning-dark flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-status-warning dark:text-status-warning-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Warning icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <Typography variant="h4" as="h2" className="mb-2">
              Invalid or Expired Link
            </Typography>
            <Typography color="secondary">
              This unsubscribe link is invalid or has expired. Links expire after 30 days.
            </Typography>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-status-error-bg dark:bg-status-error-dark flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-status-error dark:text-status-error-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Error icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <Typography variant="h4" as="h2" className="mb-2">
              Something Went Wrong
            </Typography>
            <Typography color="secondary" className="mb-2">
              We couldn't process your unsubscribe request.
            </Typography>
            {errorMessage && (
              <Typography
                variant="muted"
                color="error"
                className="bg-status-error-bg dark:bg-status-error-dark p-3 rounded-md"
              >
                {errorMessage}
              </Typography>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
