import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";

interface BaseFieldProps {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {}

export function InputField({
  label,
  error,
  helpText,
  required,
  className = "",
  id: providedId,
  ...props
}: InputFieldProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
      >
        {label} {required && <span className="text-status-error dark:text-status-error">*</span>}
      </label>
      <input
        id={id}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark ${
          error
            ? "border-status-error dark:border-status-error focus:ring-status-error focus:border-status-error"
            : "border-ui-border-primary dark:border-ui-border-primary-dark focus:ring-brand-500 focus:border-brand-500"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-status-error dark:text-status-error">{error}</p>}
      {helpText && !error && (
        <p className="mt-1 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
          {helpText}
        </p>
      )}
    </div>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseFieldProps {}

export function TextareaField({
  label,
  error,
  helpText,
  required,
  className = "",
  id: providedId,
  ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
      >
        {label} {required && <span className="text-status-error dark:text-status-error">*</span>}
      </label>
      <textarea
        id={id}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark ${
          error
            ? "border-status-error dark:border-status-error focus:ring-status-error focus:border-status-error"
            : "border-ui-border-primary dark:border-ui-border-primary-dark focus:ring-brand-500 focus:border-brand-500"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-status-error dark:text-status-error">{error}</p>}
      {helpText && !error && (
        <p className="mt-1 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
          {helpText}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseFieldProps {
  children: ReactNode;
}

export function SelectField({
  label,
  error,
  helpText,
  required,
  children,
  className = "",
  id: providedId,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
      >
        {label} {required && <span className="text-status-error dark:text-status-error">*</span>}
      </label>
      <select
        id={id}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark ${
          error
            ? "border-status-error dark:border-status-error focus:ring-status-error focus:border-status-error"
            : "border-ui-border-primary dark:border-ui-border-primary-dark focus:ring-brand-500 focus:border-brand-500"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-status-error dark:text-status-error">{error}</p>}
      {helpText && !error && (
        <p className="mt-1 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
          {helpText}
        </p>
      )}
    </div>
  );
}
