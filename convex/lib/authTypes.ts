/**
 * Type augmentations for Convex Auth integration
 *
 * The Convex Auth library extends the standard @auth/core provider types
 * by passing a database context (ctx) to sendVerificationRequest.
 * This file provides proper TypeScript types for this integration.
 *
 * See: https://github.com/get-convex/convex-auth/issues
 */

import type { QueryCtx } from "../_generated/server";

/**
 * Context type that Convex Auth passes to email provider callbacks.
 * This is effectively a QueryCtx with full database read access.
 *
 * The Convex Auth library passes this context to sendVerificationRequest,
 * but the @auth/core types don't include it in the function signature.
 */
export type ConvexAuthContext = QueryCtx;
