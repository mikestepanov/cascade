/**
 * Polyfill for React.act in React 19
 * React 19 has act but it's not properly exported, and react-dom/test-utils expects it
 */

// We need to patch the React module before it's used by tests
import { beforeAll } from "vitest";

beforeAll(() => {
  // Get the React module
  const reactModule = require("react");

  // Check if act is missing or not a function
  if (!reactModule.act || typeof reactModule.act !== "function") {
    // Create a simple act implementation
    const actImpl = (callback: () => void | Promise<void>) => {
      const result = callback();
      if (result && typeof result.then === "function") {
        return result.then(() => undefined);
      }
      return Promise.resolve();
    };

    // Try to add it to the module
    try {
      reactModule.act = actImpl;
    } catch {
      // If direct assignment fails, use defineProperty
      try {
        Object.defineProperty(reactModule, "act", {
          configurable: true,
          writable: true,
          enumerable: true,
          value: actImpl,
        });
      } catch {
        // Silent fail - act might already be defined
      }
    }
  }
});
