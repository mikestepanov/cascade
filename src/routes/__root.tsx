import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { LazyPostHog } from "../components/LazyPostHog";
import { NotFoundPage } from "../components/NotFoundPage";
import { ThemeProvider } from "../contexts/ThemeContext";
import { promptInstall, register as registerServiceWorker } from "../lib/serviceWorker";

declare global {
  interface Window {
    __convex_test_client: ConvexReactClient | undefined;
  }
}

// Initialize Convex client (only on client-side)
let convex: ConvexReactClient | null = null;
if (typeof window !== "undefined") {
  try {
    const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
    if (convexUrl) {
      convex = new ConvexReactClient(convexUrl);
      // Expose convex client globally for E2E testing
      window.__convex_test_client = convex;
    }
  } catch (_e) {
    // Convex Init Failed - fail silently on server or log appropriately if needed
  }
}

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

function RootComponent() {
  // Register service worker for PWA (client-side only, production only)
  useEffect(() => {
    // DO NOT register service worker in E2E tests as it can interfere with LocalStorage/Auth
    if (import.meta.env.PROD && !window.__convex_test_client) {
      registerServiceWorker();
      promptInstall();
    }
  }, []);

  return (
    <ThemeProvider>
      <LazyPostHog apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={posthogOptions}>
        {convex ? (
          <ConvexAuthProvider client={convex}>
            <Outlet />
          </ConvexAuthProvider>
        ) : (
          // Fallback if convex is missing (or local dev without env)
          <Outlet />
        )}
        <Toaster />
      </LazyPostHog>
    </ThemeProvider>
  );
}
