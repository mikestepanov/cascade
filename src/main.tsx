import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { getRouter } from "./router";
import "./index.css";

const router = getRouter();

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  // Expose router for E2E testing (in dev or explicit e2e mode)
  if (import.meta.env.DEV || import.meta.env.MODE === "e2e") {
    (window as any).router = router;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
