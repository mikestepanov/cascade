import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

// Google OAuth is configured below. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
// environment variables to enable. See docs/AUTHENTICATION.md for setup instructions.
// Password reset requires RESEND_API_KEY and RESEND_FROM_EMAIL environment variables.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, Password({ reset: ResendOTPPasswordReset })],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
