import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";
import { LazyPostHog } from "../components/LazyPostHog";
import { ThemeProvider } from "../contexts/ThemeContext";
// Import global styles as URL for SSR (prevents FOUC)
import appCss from "../index.css?url";
import { promptInstall, register as registerServiceWorker } from "../lib/serviceWorker";

// Initialize Convex client (only on client-side)
let convex: ConvexReactClient | null = null;
if (typeof window !== "undefined") {
  convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
}

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nixelo - Project Management" },
      {
        name: "description",
        content: "Collaborative project management platform with real-time editing",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  // Register service worker for PWA (client-side only, production only)
  useEffect(() => {
    if (import.meta.env.PROD) {
      registerServiceWorker();
      promptInstall();
    }
  }, []);

  return (
    <RootDocument>
      <ThemeProvider>
        <LazyPostHog apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={posthogOptions}>
          {convex ? (
            <ConvexAuthProvider client={convex}>
              <Outlet />
            </ConvexAuthProvider>
          ) : (
            // SSR fallback - will hydrate with Convex on client
            <Outlet />
          )}
          <Toaster />
        </LazyPostHog>
      </ThemeProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
