import { TooltipProvider } from "@/components/ui/Tooltip";
import {
  type RenderHookOptions,
  type RenderHookResult,
  type RenderOptions,
  render as rtlRender,
  renderHook as rtlRenderHook,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { flushSync } from "react-dom";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>;
};

/**
 * Custom render for React 19 that uses flushSync to ensure synchronous rendering
 *
 * React 19 uses concurrent rendering by default, which means render() is async.
 * Testing Library doesn't wait for concurrent updates, so tests see empty containers.
 *
 * Solution: Wrap render in flushSync() to force synchronous rendering.
 */
export function render(ui: ReactElement, options?: RenderOptions) {
  let result: ReturnType<typeof rtlRender> | undefined;
  flushSync(() => {
    result = rtlRender(ui, { wrapper: AllTheProviders, ...options });
  });
  return result as ReturnType<typeof rtlRender>;
}

/**
 * Custom renderHook for React 19 that uses flushSync
 */
export function renderHook<Result, Props>(
  callback: (props: Props) => Result,
  options?: RenderHookOptions<Props>,
): RenderHookResult<Result, Props> {
  let result: RenderHookResult<Result, Props> | undefined;
  flushSync(() => {
    result = rtlRenderHook(callback, options);
  });
  return result as RenderHookResult<Result, Props>;
}

// Re-export everything else from RTL
export * from "@testing-library/react";
