/**
 * TanStack Form utilities and field wrappers
 *
 * Provides typed field components that connect TanStack Form to our UI components.
 *
 * @example
 * ```tsx
 * import { useAppForm } from "@/lib/form";
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   title: z.string().min(1, "Title is required"),
 *   priority: z.enum(["low", "medium", "high"]),
 * });
 *
 * function MyForm() {
 *   const form = useAppForm({
 *     defaultValues: { title: "", priority: "medium" },
 *     validators: { onChange: schema },
 *     onSubmit: async ({ value }) => {
 *       await saveToDB(value);
 *     },
 *   });
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
 *       <form.Field name="title">
 *         {(field) => <FormInput field={field} label="Title" />}
 *       </form.Field>
 *       <form.Field name="priority">
 *         {(field) => (
 *           <FormSelect field={field} label="Priority" options={priorityOptions} />
 *         )}
 *       </form.Field>
 *       <form.Subscribe selector={(state) => state.isSubmitting}>
 *         {(isSubmitting) => (
 *           <Button type="submit" isLoading={isSubmitting}>Save</Button>
 *         )}
 *       </form.Subscribe>
 *     </form>
 *   );
 * }
 * ```
 */

export { FormCheckbox, FormInput, FormSelect, FormTextarea } from "./FormFields";
export type { AppForm, AppFormOptions, FormFieldProps } from "./types";
export { useAppForm } from "./useAppForm";
