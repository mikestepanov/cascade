import type { FieldApi } from "@tanstack/react-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import type { CheckboxProps } from "@/components/ui/form/Checkbox";
import type { InputProps } from "@/components/ui/form/Input";
import type { SelectProps } from "@/components/ui/form/Select";
import type { TextareaProps } from "@/components/ui/form/Textarea";

/**
 * Get the first error message from field state
 */
function getFieldError(
  field: FieldApi<unknown, string, unknown, unknown, unknown>,
): string | undefined {
  const errors = field.state.meta.errors;
  if (!errors || errors.length === 0) return undefined;

  // Handle both string errors and validation objects
  const firstError = errors[0];
  if (typeof firstError === "string") return firstError;
  if (firstError && typeof firstError === "object" && "message" in firstError) {
    return (firstError as { message: string }).message;
  }
  return String(firstError);
}

/**
 * Props for form field wrappers
 */
interface BaseFieldProps<TData, TName extends string> {
  field: FieldApi<TData, TName, unknown, unknown, unknown>;
  label?: string;
  helperText?: string;
}

// ============================================================================
// FormInput
// ============================================================================

interface FormInputProps<TData, TName extends string>
  extends BaseFieldProps<TData, TName>,
    Omit<InputProps, "name" | "value" | "onChange" | "onBlur" | "error"> {}

/**
 * Input field connected to TanStack Form
 *
 * @example
 * ```tsx
 * <form.Field name="email">
 *   {(field) => (
 *     <FormInput
 *       field={field}
 *       label="Email"
 *       type="email"
 *       placeholder="Enter email"
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export function FormInput<TData, TName extends string>({
  field,
  label,
  helperText,
  ...props
}: FormInputProps<TData, TName>) {
  return (
    <Input
      name={field.name}
      value={(field.state.value as string) ?? ""}
      onChange={(e) => field.handleChange(e.target.value as TData[TName & keyof TData])}
      onBlur={field.handleBlur}
      error={getFieldError(field)}
      label={label}
      helperText={helperText}
      {...props}
    />
  );
}

// ============================================================================
// FormTextarea
// ============================================================================

interface FormTextareaProps<TData, TName extends string>
  extends BaseFieldProps<TData, TName>,
    Omit<TextareaProps, "name" | "value" | "onChange" | "onBlur" | "error"> {}

/**
 * Textarea field connected to TanStack Form
 *
 * @example
 * ```tsx
 * <form.Field name="description">
 *   {(field) => (
 *     <FormTextarea
 *       field={field}
 *       label="Description"
 *       rows={4}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export function FormTextarea<TData, TName extends string>({
  field,
  label,
  helperText,
  ...props
}: FormTextareaProps<TData, TName>) {
  return (
    <Textarea
      name={field.name}
      value={(field.state.value as string) ?? ""}
      onChange={(e) => field.handleChange(e.target.value as TData[TName & keyof TData])}
      onBlur={field.handleBlur}
      error={getFieldError(field)}
      label={label}
      helperText={helperText}
      {...props}
    />
  );
}

// ============================================================================
// FormSelect
// ============================================================================

interface FormSelectProps<TData, TName extends string>
  extends BaseFieldProps<TData, TName>,
    Omit<SelectProps, "name" | "value" | "onChange" | "onBlur" | "error"> {}

/**
 * Select field connected to TanStack Form
 *
 * @example
 * ```tsx
 * <form.Field name="priority">
 *   {(field) => (
 *     <FormSelect
 *       field={field}
 *       label="Priority"
 *       options={[
 *         { value: "low", label: "Low" },
 *         { value: "medium", label: "Medium" },
 *         { value: "high", label: "High" },
 *       ]}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export function FormSelect<TData, TName extends string>({
  field,
  label,
  helperText,
  children,
  ...props
}: FormSelectProps<TData, TName>) {
  return (
    <Select
      name={field.name}
      value={(field.state.value as string) ?? ""}
      onChange={(e) => field.handleChange(e.target.value as TData[TName & keyof TData])}
      onBlur={field.handleBlur}
      error={getFieldError(field)}
      label={label}
      helperText={helperText}
      {...props}
    >
      {children}
    </Select>
  );
}

// ============================================================================
// FormCheckbox
// ============================================================================

interface FormCheckboxProps<TData, TName extends string>
  extends BaseFieldProps<TData, TName>,
    Omit<CheckboxProps, "name" | "checked" | "onChange" | "onBlur" | "error"> {}

/**
 * Checkbox field connected to TanStack Form
 *
 * @example
 * ```tsx
 * <form.Field name="acceptTerms">
 *   {(field) => (
 *     <FormCheckbox
 *       field={field}
 *       label="I accept the terms"
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export function FormCheckbox<TData, TName extends string>({
  field,
  label,
  helperText,
  ...props
}: FormCheckboxProps<TData, TName>) {
  return (
    <Checkbox
      name={field.name}
      checked={(field.state.value as boolean) ?? false}
      onChange={(e) => field.handleChange(e.target.checked as TData[TName & keyof TData])}
      onBlur={field.handleBlur}
      error={getFieldError(field)}
      label={label}
      helperText={helperText}
      {...props}
    />
  );
}
