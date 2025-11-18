import { httpRouter } from "convex/server";
import { handler as issuesHandler } from "./api/issues";

const http = httpRouter();

// REST API routes
http.route({
  path: "/api/issues",
  method: "GET",
  handler: issuesHandler,
});

export default http;
