// React 19 doesn't export act, so we create a simple implementation
// that RTL can use

const testUtils = require("react-dom/test-utils");

// Simple act implementation - just run the callback
const actImpl = (callback: () => void | Promise<void>) => {
  const result = callback();
  if (result && typeof result.then === "function") {
    return result.then(() => undefined);
  }
  return Promise.resolve();
};

// Patch test-utils
testUtils.act = actImpl;
