/**
 * Reusable hooks for common patterns
 *
 * @example
 * import { useModal, useEntityForm, useAsyncMutation } from "@/hooks";
 */

// Async operations
export {
  type UseAsyncMutationOptions,
  type UseAsyncMutationReturn,
  useAsyncMutation,
} from "./useAsyncMutation";
export {
  type UseDeleteConfirmationOptions,
  type UseDeleteConfirmationReturn,
  useDeleteConfirmation,
} from "./useDeleteConfirmation";
export { useEntityForm } from "./useEntityForm";
export { type FileUploadOptions, type FileUploadReturn, useFileUpload } from "./useFileUpload";
export {
  type UseFuzzySearchOptions,
  type UseFuzzySearchReturn,
  useFuzzySearch,
} from "./useFuzzySearch";
export { useKeyboardShortcuts } from "./useKeyboardShortcuts";
// Navigation & search
export {
  type UseListNavigationOptions,
  type UseListNavigationReturn,
  useListNavigation,
} from "./useListNavigation";
// State management
export { type UseModalReturn, useModal } from "./useModal";

// Offline support
export { useOffline } from "./useOffline";
