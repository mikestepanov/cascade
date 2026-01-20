/**
 * Reusable Convex Validators
 *
 * Contains validators for complex data structures that would otherwise use v.any().
 * Using explicit validators provides:
 * - Runtime type validation
 * - Better TypeScript inference
 * - Self-documenting schemas
 *
 * @see https://docs.convex.dev/database/schemas
 */

import { v } from "convex/values";

// =============================================================================
// ProseMirror / BlockNote Content
// =============================================================================

/**
 * ProseMirror node structure (recursive).
 * This is a loose validator that captures the general shape without being overly strict,
 * since the editor library defines the exact structure.
 *
 * @see https://prosemirror.net/docs/ref/#model.Node
 */
export const proseMirrorNode = v.object({
  type: v.string(),
  attrs: v.optional(v.record(v.string(), v.any())), // Attributes vary by node type
  content: v.optional(v.array(v.any())), // Recursive - children are also nodes
  marks: v.optional(
    v.array(
      v.object({
        type: v.string(),
        attrs: v.optional(v.record(v.string(), v.any())),
      }),
    ),
  ),
  text: v.optional(v.string()), // Text nodes have text instead of content
});

/**
 * ProseMirror document snapshot.
 * Used for document versions and collaborative editing state.
 */
export const proseMirrorSnapshot = v.object({
  type: v.literal("doc"),
  content: v.optional(v.array(v.any())), // Array of proseMirrorNode
});

/**
 * BlockNote content structure.
 * BlockNote uses a simplified block-based structure on top of ProseMirror.
 *
 * @see https://www.blocknotejs.org/docs/editor-basics/document-structure
 */
export const blockNoteContent = v.array(
  v.object({
    id: v.optional(v.string()),
    type: v.string(), // "paragraph", "heading", "bulletListItem", etc.
    props: v.optional(v.record(v.string(), v.any())), // Block-specific properties
    content: v.optional(v.array(v.any())), // Inline content
    children: v.optional(v.array(v.any())), // Nested blocks
  }),
);

// =============================================================================
// Dashboard Layout
// =============================================================================

/**
 * Dashboard widget configuration.
 */
export const dashboardWidget = v.object({
  id: v.string(),
  type: v.string(), // "issues", "activity", "sprint", "chart", etc.
  position: v.object({
    x: v.number(),
    y: v.number(),
    w: v.number(),
    h: v.number(),
  }),
  config: v.optional(v.record(v.string(), v.any())), // Widget-specific config
});

/**
 * Dashboard layout configuration.
 * Stores user's dashboard widget arrangement and preferences.
 */
export const dashboardLayout = v.object({
  widgets: v.array(dashboardWidget),
  columns: v.optional(v.number()), // Grid columns (default: 12)
  rowHeight: v.optional(v.number()), // Row height in pixels
});

// =============================================================================
// Audit Log Metadata
// =============================================================================

/**
 * Audit log metadata for various action types.
 * Using a flexible record since metadata varies by action.
 */
export const auditMetadata = v.record(
  v.string(),
  v.union(
    v.string(),
    v.number(),
    v.boolean(),
    v.null(),
    v.array(v.string()),
    v.object({
      old: v.optional(v.union(v.string(), v.number(), v.null())),
      new: v.optional(v.union(v.string(), v.number(), v.null())),
    }),
  ),
);

// =============================================================================
// Calendar Event (from external providers)
// =============================================================================

/**
 * Google Calendar event structure (simplified).
 * External data - using loose validation since structure is defined by Google.
 */
export const googleCalendarEvent = v.object({
  id: v.optional(v.string()),
  summary: v.optional(v.string()),
  description: v.optional(v.string()),
  start: v.optional(
    v.object({
      dateTime: v.optional(v.string()),
      date: v.optional(v.string()),
      timeZone: v.optional(v.string()),
    }),
  ),
  end: v.optional(
    v.object({
      dateTime: v.optional(v.string()),
      date: v.optional(v.string()),
      timeZone: v.optional(v.string()),
    }),
  ),
  attendees: v.optional(
    v.array(
      v.object({
        email: v.optional(v.string()),
        displayName: v.optional(v.string()),
        responseStatus: v.optional(v.string()),
      }),
    ),
  ),
  hangoutLink: v.optional(v.string()),
  htmlLink: v.optional(v.string()),
  status: v.optional(v.string()),
  organizer: v.optional(
    v.object({
      email: v.optional(v.string()),
      displayName: v.optional(v.string()),
    }),
  ),
});

// =============================================================================
// Webhook Payload
// =============================================================================

/**
 * External webhook payload.
 * Structure varies by provider (GitHub, Slack, etc.).
 * Using v.any() is acceptable here - document the reason.
 *
 * NOTE: This intentionally uses v.any() because:
 * 1. Payload structure varies by webhook provider
 * 2. We don't control the external schema
 * 3. Validation happens in provider-specific handlers
 */
export const webhookPayload = v.any();

// =============================================================================
// Type Exports (for TypeScript usage)
// =============================================================================

export type ProseMirrorNode = typeof proseMirrorNode._type;
export type ProseMirrorSnapshot = typeof proseMirrorSnapshot._type;
export type BlockNoteContent = typeof blockNoteContent._type;
export type DashboardWidget = typeof dashboardWidget._type;
export type DashboardLayout = typeof dashboardLayout._type;
export type AuditMetadata = typeof auditMetadata._type;
export type GoogleCalendarEvent = typeof googleCalendarEvent._type;
