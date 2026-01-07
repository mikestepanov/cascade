import type { ConvexReactClient } from "convex/react";
// We use 'any' for Router generic params to avoid complex type reconstruction
// that isn't needed for simple .navigate calls.
import type { Router } from "@tanstack/react-router";

declare global {
  interface Window {
    __convex_test_client?: ConvexReactClient;
    router?: Router<any, any>;
  }
}
