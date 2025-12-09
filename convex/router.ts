import { httpRouter } from "convex/server";
import { handler as issuesHandler } from "./api/issues";
import { securePasswordReset } from "./authWrapper";
import {
  cleanupRbacProjectEndpoint,
  cleanupTestUsersEndpoint,
  createTestUserEndpoint,
  deleteTestUserEndpoint,
  resetOnboardingEndpoint,
  setupRbacProjectEndpoint,
  verifyTestUserEndpoint,
} from "./e2e";
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

// Auth wrapper routes (security)
http.route({
  path: "/auth/request-reset",
  method: "POST",
  handler: securePasswordReset,
});

// E2E testing routes
// Create a test user (bypassing email verification)
http.route({
  path: "/e2e/create-test-user",
  method: "POST",
  handler: createTestUserEndpoint,
});

// Delete a test user
http.route({
  path: "/e2e/delete-test-user",
  method: "POST",
  handler: deleteTestUserEndpoint,
});

// Reset onboarding state for test user(s)
http.route({
  path: "/e2e/reset-onboarding",
  method: "POST",
  handler: resetOnboardingEndpoint,
});

// Garbage collection - cleanup old test users
http.route({
  path: "/e2e/cleanup",
  method: "POST",
  handler: cleanupTestUsersEndpoint,
});

// Set up RBAC test project with users in different roles
http.route({
  path: "/e2e/setup-rbac-project",
  method: "POST",
  handler: setupRbacProjectEndpoint,
});

// Clean up RBAC test project
http.route({
  path: "/e2e/cleanup-rbac-project",
  method: "POST",
  handler: cleanupRbacProjectEndpoint,
});

// Verify a test user's email (bypass verification flow)
http.route({
  path: "/e2e/verify-test-user",
  method: "POST",
  handler: verifyTestUserEndpoint,
});

export default http;
