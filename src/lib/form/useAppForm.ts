import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import type { AppFormOptions } from "./types";

/**
 * App-specific form hook with Zod validation
 *
 * Wraps TanStack Form's useForm with our Zod adapter pre-configured.
 *
 * @example
 * ```tsx
 * const schema = z.object({
 *   email: z.string().email("Invalid email"),
 *   password: z.string().min(8, "Too short"),
 * });
 *
 * const form = useAppForm({
 *   defaultValues: { email: "", password: "" },
 *   validators: { onChange: schema },
 *   onSubmit: async ({ value }) => {
 *     await signIn(value);
 *   },
 * });
 * ```
 */
export function useAppForm<TData extends Record<string, unknown>>(options: AppFormOptions<TData>) {
  const { validators, ...restOptions } = options;

  return useForm({
    ...restOptions,
    validatorAdapter: zodValidator(),
    validators: validators
      ? {
          onChange: validators.onChange,
          onBlur: validators.onBlur,
          onSubmit: validators.onSubmit,
        }
      : undefined,
  });
}
