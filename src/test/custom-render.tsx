import { type RenderOptions, render as rtlRender } from "@testing-library/react";
import type { ReactElement } from "react";
import { flushSync } from "react-dom";

/**
 * Custom render for React 19 that uses flushSync to ensure synchronous rendering
 *
 * React 19 uses concurrent rendering by default, which means render() is async.
 * Testing Library doesn't wait for concurrent updates, so tests see empty containers.
 *
 * Solution: Wrap render in flushSync() to force synchronous rendering.
 */
export function render(ui: ReactElement, options?: RenderOptions) {
  let result: ReturnType<typeof rtlRender>;
  flushSync(() => {
    result = rtlRender(ui, options);
  });
  return result!;
}

// Re-export everything else from RTL
export * from "@testing-library/react";
