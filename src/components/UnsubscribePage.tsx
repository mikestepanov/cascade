/**
 * Unsubscribe Page
 *
 * Allows users to unsubscribe from email notifications via one-click link
 */

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { LoadingSpinner } from "./ui/LoadingSpinner";

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
            <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
              Processing...
            </h2>
            <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
              Unsubscribing you from email notifications
            </p>
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
            <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
              Successfully Unsubscribed
            </h2>
            <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-6">
              You have been unsubscribed from all email notifications.
            </p>
            <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              You can update your notification preferences anytime by logging into your account.
            </p>
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
            <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
              Invalid or Expired Link
            </h2>
            <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
              This unsubscribe link is invalid or has expired. Links expire after 30 days.
            </p>
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
            <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
              Something Went Wrong
            </h2>
            <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-2">
              We couldn't process your unsubscribe request.
            </p>
            {errorMessage && (
              <p className="text-sm text-status-error dark:text-status-error-dark bg-status-error-bg dark:bg-status-error-dark p-3 rounded-md">
                {errorMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
