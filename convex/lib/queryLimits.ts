/**
 * Centralized query limits and pagination constants
 *
 * These constants prevent:
 * - Arbitrary hardcoded numbers scattered across the codebase
 * - Inconsistent pagination behavior
 * - Memory issues from unbounded queries
 *
 * Adjust these values based on your data scale and performance requirements.
 */

// =============================================================================
// PAGINATION DEFAULTS
// =============================================================================

/** Default page size for list queries */
export const DEFAULT_PAGE_SIZE = 50;

/** Default page size for search queries */
export const DEFAULT_SEARCH_PAGE_SIZE = 20;

/** Maximum allowed page size (prevents abuse) */
export const MAX_PAGE_SIZE = 100;

/** Maximum offset for pagination (prevents deep pagination abuse) */
export const MAX_OFFSET = 1000;

// =============================================================================
// FETCH BUFFERS
// =============================================================================

/**
 * Multiplier for fetch buffer when combining/filtering results
 * e.g., if limit=50 and we filter ~50% of results, fetch 50*3=150 to ensure enough
 */
export const FETCH_BUFFER_MULTIPLIER = 3;

// =============================================================================
// ACTIVITY & FEED LIMITS
// =============================================================================

/** Max recent activity items to fetch for dashboards/feeds */
export const MAX_ACTIVITY_ITEMS = 100;

/** Max activity items for analytics/reporting (larger sample needed) */
export const MAX_ACTIVITY_FOR_ANALYTICS = 1000;

// =============================================================================
// CONTEXT LIMITS (for AI, search, etc.)
// =============================================================================

/** Max items to include in AI context */
export const MAX_AI_CONTEXT_ITEMS = 100;

/** Max issues to include in search/suggestions context */
export const MAX_SEARCH_CONTEXT_ITEMS = 20;

// =============================================================================
// SPECIFIC FEATURE LIMITS
// =============================================================================

/** Max sprints to include in velocity calculation */
export const MAX_VELOCITY_SPRINTS = 10;

/** Max API key usage records per query */
export const MAX_API_KEY_USAGE_RECORDS = 100;

/** Max offline sync items per request */
export const MAX_OFFLINE_SYNC_ITEMS = 50;

/** Max compliance records for reports */
export const MAX_COMPLIANCE_RECORDS = 1000;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Clamp a limit to valid range */
export function clampLimit(
  requested: number | undefined,
  defaultLimit = DEFAULT_PAGE_SIZE,
): number {
  return Math.min(requested ?? defaultLimit, MAX_PAGE_SIZE);
}

/** Clamp an offset to valid range */
export function clampOffset(requested: number | undefined): number {
  return Math.min(requested ?? 0, MAX_OFFSET);
}

/** Calculate fetch buffer for queries that need filtering */
export function calculateFetchBuffer(limit: number, offset = 0): number {
  return (offset + limit) * FETCH_BUFFER_MULTIPLIER;
}
