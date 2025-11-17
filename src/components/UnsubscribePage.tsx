/**
 * Unsubscribe Page
 *
 * Allows users to unsubscribe from email notifications via one-click link
 */

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === "loading" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing...</h2>
            <p className="text-gray-600">Unsubscribing you from email notifications</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully Unsubscribed</h2>
            <p className="text-gray-600 mb-6">
              You have been unsubscribed from all email notifications.
            </p>
            <p className="text-sm text-gray-500">
              You can update your notification preferences anytime by logging into your account.
            </p>
          </div>
        )}

        {status === "invalid" && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid or Expired Link</h2>
            <p className="text-gray-600">
              This unsubscribe link is invalid or has expired. Links expire after 30 days.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something Went Wrong</h2>
            <p className="text-gray-600 mb-2">We couldn't process your unsubscribe request.</p>
            {errorMessage && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errorMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
