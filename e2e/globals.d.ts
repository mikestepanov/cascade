import type { ConvexReactClient } from "convex/react";

declare global {
  interface Window {
    __convex_test_client?: ConvexReactClient;
  }
}
