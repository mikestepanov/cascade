import type { ValidationError } from "@tanstack/react-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import type { CheckboxProps } from "@/components/ui/form/Checkbox";
import type { InputProps } from "@/components/ui/form/Input";
import type { SelectProps } from "@/components/ui/form/Select";
import type { TextareaProps } from "@/components/ui/form/Textarea";

// Define Updater locally as it's a simple type used by TanStack Form
type Updater<T> = T | ((old: T) => T);

/**
 * Get the first error message from field state
 */
function getFieldError(field: {
  state: { meta: { errors: ValidationError[] } };
}): string | undefined {
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
interface BaseFieldProps<TName extends string, TValue> {
  field: {
    name: TName;
    state: {
      value: TValue;
      meta: {
        errors: ValidationError[];
      };
    };
    handleChange: (updater: Updater<TValue>) => void;
    handleBlur: () => void;
  };
  label?: string;
  helperText?: string;
}

// ============================================================================
// FormInput
// ============================================================================

interface FormInputProps<TName extends string>
  extends BaseFieldProps<TName, string | undefined | null>,
    Omit<InputProps, "name" | "value" | "onChange" | "onBlur" | "error"> {}

/**
 * Input field connected to TanStack Form
 */
export function FormInput<TName extends string>({
  field,
  label,
  helperText,
  ...props
}: FormInputProps<TName>) {
  return (
    <Input
      name={field.name}
      value={field.state.value ?? ""}
      onChange={(e) => field.handleChange(e.target.value)}
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

interface FormTextareaProps<TName extends string>
  extends BaseFieldProps<TName, string | undefined | null>,
    Omit<TextareaProps, "name" | "value" | "onChange" | "onBlur" | "error"> {}

/**
 * Textarea field connected to TanStack Form
 */
export function FormTextarea<TName extends string>({
  field,
  label,
  helperText,
  ...props
}: FormTextareaProps<TName>) {
  return (
    <Textarea
      name={field.name}
      value={field.state.value ?? ""}
      onChange={(e) => field.handleChange(e.target.value)}
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

interface FormSelectProps<TName extends string>
  extends BaseFieldProps<TName, string | undefined | null>,
    Omit<SelectProps, "name" | "value" | "onChange" | "onBlur" | "error"> {}

/**
 * Select field connected to TanStack Form
 */
export function FormSelect<TName extends string>({
  field,
  label,
  helperText,
  children,
  ...props
}: FormSelectProps<TName>) {
  return (
    <Select
      name={field.name}
      value={field.state.value ?? ""}
      onChange={(e) => field.handleChange(e.target.value)}
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

interface FormCheckboxProps<TName extends string>
  extends BaseFieldProps<TName, boolean | undefined | null>,
    Omit<CheckboxProps, "name" | "checked" | "onChange" | "onBlur" | "error"> {}

/**
 * Checkbox field connected to TanStack Form
 */
export function FormCheckbox<TName extends string>({
  field,
  label,
  helperText,
  ...props
}: FormCheckboxProps<TName>) {
  return (
    <Checkbox
      name={field.name}
      checked={field.state.value ?? false}
      onChange={(e) => field.handleChange(e.target.checked)}
      onBlur={field.handleBlur}
      error={getFieldError(field)}
      label={label}
      helperText={helperText}
      {...props}
    />
  );
}
