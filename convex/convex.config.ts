import presence from "@convex-dev/presence/convex.config";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";
import actionCache from "@convex-dev/action-cache/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(prosemirrorSync);
app.use(presence);
app.use(aggregate);
app.use(actionCache);
app.use(rateLimiter);

export default app;
