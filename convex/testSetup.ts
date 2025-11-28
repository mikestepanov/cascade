/// <reference types="vite/client" />

/**
 * Test setup file for Convex backend tests
 *
 * Uses import.meta.glob for automatic module discovery with pnpm.
 * This solves the "Could not find the _generated directory" error.
 *
 * @see https://docs.convex.dev/testing/convex-test
 * @see https://discord-questions.convex.dev/m/1279661189684662292
 *
 * Usage:
 * ```typescript
 * import { convexTest } from "convex-test";
 * import { modules } from "./testSetup";
 * import schema from "./schema";
 *
 * const t = convexTest(schema, modules);
 * ```
 */

// Use import.meta.glob to automatically discover all Convex modules
// Pattern: ./**/*.ts excluding test files, config files, and _generated
export const modules = import.meta.glob("./**/!(*.*.*|_generated|*.test|*.config)*.*s");
