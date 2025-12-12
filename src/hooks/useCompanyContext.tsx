import type { Id } from "@convex/_generated/dataModel";
import { createContext, useContext } from "react";

/**
 * Company context type
 * Contains information about the current company from the URL
 */
export interface CompanyContextType {
  companyId: Id<"companies">;
  companySlug: string;
  companyName: string;
  userRole: "owner" | "admin" | "member";
  billingEnabled: boolean;
}

/**
 * Company Context
 * This context is provided by the $companySlug route layout
 * and consumed by components that need company information.
 *
 * IMPORTANT: This context is defined in a separate file (not in the route file)
 * to prevent code-splitting issues with TanStack Router's file-based routing.
 * When the context is defined in the route file, it can be bundled separately
 * from consumer components, causing useContext to return null.
 */
export const CompanyContext = createContext<CompanyContextType | null>(null);

/**
 * Hook to access current company from URL
 * Must be used within a $companySlug route
 * @throws Error if used outside company route context
 */
export function useCompany(): CompanyContextType {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a company route");
  }
  return context;
}

/**
 * Optional hook to access company - returns null if not in company context
 * Use this for components that might render before context is available
 * or that can gracefully handle missing company context
 */
export function useCompanyOptional(): CompanyContextType | null {
  return useContext(CompanyContext);
}
