import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * Hook to get the current authenticated user
 * @returns Object with user data (or undefined if loading/not authenticated)
 */
export function useCurrentUser() {
  const user = useQuery(api.users.getCurrent);

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: user !== null,
  };
}
