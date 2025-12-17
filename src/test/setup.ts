import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "./react-act-polyfill";

// Set React ACT environment flag for React 19
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock ResizeObserver for components that use it (like cmdk)
class ResizeObserverMock implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock;

// Cleanup after each test
afterEach(() => {
  cleanup();
});
