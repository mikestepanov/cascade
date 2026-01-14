import type { AnyFieldApi, AnyFormApi } from "@tanstack/react-form";

/**
 * Type alias for any form field API
 * Use this when you need to accept any field without specific generics
 */
export type AppFieldApi = AnyFieldApi;

/**
 * Type alias for any form API
 * Use this when you need to accept any form without specific generics
 */
export type AppFormApi = AnyFormApi;

/**
 * Generic field props for form field wrappers
 * Using AnyFieldApi which is the official TanStack convenience type
 */
export interface FormFieldProps {
  field: AnyFieldApi;
  label?: string;
  helperText?: string;
}
