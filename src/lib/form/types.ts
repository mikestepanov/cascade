import type { FormApi, FormOptions } from "@tanstack/react-form";
import type { ZodType } from "zod";

/**
 * Generic field props for form field wrappers
 */
export interface FormFieldProps<TData, _TName extends keyof TData & string> {
  // biome-ignore lint/suspicious/noExplicitAny: generic hell
  field: any;
  label?: string;
  helperText?: string;
}

/**
 * App-specific form options with Zod validation support
 */
export interface AppFormOptions<TData extends Record<string, unknown>>
  extends Omit<any, "validatorAdapter"> {
  /**
   * Zod schema for form validation
   * Applied on change and submit
   */
  validators?: {
    onChange?: ZodType<TData>;
    onBlur?: ZodType<TData>;
    onSubmit?: ZodType<TData>;
  };
}

/**
 * Type for the form instance returned by useAppForm
 */
export type AppForm<TData extends Record<string, unknown>> = any;
