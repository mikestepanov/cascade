/**
 * Re-export Convex API for bot-service
 *
 * Uses anyApi to dynamically reference Convex functions without
 * needing the generated types at runtime.
 */
import { anyApi } from "convex/server";

export const api = anyApi;
