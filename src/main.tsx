import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { createRoot } from "react-dom/client";
import { LazyPostHog } from "./components/LazyPostHog";
import { ThemeProvider } from "./contexts/ThemeContext";
import { promptInstall, register as registerServiceWorker } from "./lib/serviceWorker";
import "./index.css";
import App from "./App";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Register service worker for offline support
if (import.meta.env.PROD) {
  registerServiceWorker();
  promptInstall();
}

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <ThemeProvider>
    <LazyPostHog apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={posthogOptions}>
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    </LazyPostHog>
  </ThemeProvider>,
);
