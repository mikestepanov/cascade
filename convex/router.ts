import { httpRouter } from "convex/server";
import { handler as issuesHandler } from "./api/issues";
import { getOTPEndpoint } from "./e2e";
import { handleCallback, initiateAuth, triggerSync } from "./http/googleOAuth";

const http = httpRouter();

// REST API routes
http.route({
  path: "/api/issues",
  method: "GET",
  handler: issuesHandler,
});

// Google Calendar OAuth routes
http.route({
  path: "/google/auth",
  method: "GET",
  handler: initiateAuth,
});

http.route({
  path: "/google/callback",
  method: "GET",
  handler: handleCallback,
});

http.route({
  path: "/google/sync",
  method: "POST",
  handler: triggerSync,
});

// E2E testing routes (for test email OTP retrieval)
http.route({
  path: "/e2e/otp",
  method: "GET",
  handler: getOTPEndpoint,
});

export default http;
