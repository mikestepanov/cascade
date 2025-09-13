import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { PostHogProvider } from "posthog-js/react";
import "./index.css";
import App from "./App";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

createRoot(document.getElementById("root")!).render(
  <PostHogProvider 
    apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} 
    options={posthogOptions}
  >
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </PostHogProvider>,
);
