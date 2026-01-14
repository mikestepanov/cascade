import type { Updater, ValidationError } from "@tanstack/react-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import type { CheckboxProps } from "@/components/ui/form/Checkbox";
import type { InputProps } from "@/components/ui/form/Input";
import type { SelectProps } from "@/components/ui/form/Select";
import type { TextareaProps } from "@/components/ui/form/Textarea";

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
interface BaseFieldProps {
  label?: string;
  helperText?: string;
}

// ============================================================================
// FormInput
// ============================================================================

interface FormInputProps<TName extends string>
  extends BaseFieldProps,
    Omit<InputProps, "name" | "value" | "onChange" | "onBlur" | "error"> {
  field: {
    name: TName;
    state: {
      value: unknown;
      meta: {
        errors: ValidationError[];
      };
    };
    handleChange: (updater: Updater<string>) => void;
    handleBlur: () => void;
  };
}

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
      value={(field.state.value as string) ?? ""}
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
  extends BaseFieldProps,
    Omit<TextareaProps, "name" | "value" | "onChange" | "onBlur" | "error"> {
  field: {
    name: TName;
    state: {
      value: unknown;
      meta: {
        errors: ValidationError[];
      };
    };
    handleChange: (updater: Updater<string>) => void;
    handleBlur: () => void;
  };
}

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
      value={(field.state.value as string) ?? ""}
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

interface FormSelectProps<TName extends string, TValue>
  extends BaseFieldProps,
    Omit<SelectProps, "name" | "value" | "onChange" | "onBlur" | "error"> {
  field: {
    name: TName;
    state: {
      value: unknown;
      meta: {
        errors: ValidationError[];
      };
    };
    handleChange: (updater: Updater<TValue>) => void;
    handleBlur: () => void;
  };
}

/**
 * Select field connected to TanStack Form
 */
export function FormSelect<TName extends string, TValue>({
  field,
  label,
  helperText,
  children,
  ...props
}: FormSelectProps<TName, TValue>) {
  return (
    <Select
      name={field.name}
      value={(field.state.value as string) ?? ""}
      onChange={(e) => field.handleChange(e.target.value as TValue)}
      onBlur={field.handleBlur}
      error={getFieldError(field)}
      label={label}
      helperText={helperText}
      {...props}
    />
  );
}

// ============================================================================
// FormCheckbox
// ============================================================================

interface FormCheckboxProps<TName extends string>
  extends BaseFieldProps,
    Omit<CheckboxProps, "name" | "checked" | "onChange" | "onBlur" | "error"> {
  field: {
    name: TName;
    state: {
      value: unknown;
      meta: {
        errors: ValidationError[];
      };
    };
    handleChange: (updater: Updater<boolean>) => void;
    handleBlur: () => void;
  };
}

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
      checked={!!field.state.value}
      onChange={(e) => field.handleChange(e.target.checked)}
      onBlur={field.handleBlur}
      error={getFieldError(field)}
      label={label}
      helperText={helperText}
      {...props}
    />
  );
}
