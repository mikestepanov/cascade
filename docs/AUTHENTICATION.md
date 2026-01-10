# Authentication & User Management

This document describes the authentication and user management features in Nixelo.

## Authentication Methods

Nixelo supports two authentication methods:

### 1. Email & Password

Users can sign up and sign in using their email and password.

**Sign Up Flow:**

1. User enters email and password on sign-in page
2. Clicks "Sign up" button
3. Account is created automatically
4. User is logged in

**Sign In Flow:**

1. User enters email and password
2. Clicks "Sign in" button
3. User is logged in

**Password Reset Flow:**

1. User clicks "Forgot password?" on sign-in page
2. User enters their email address
3. System sends an 8-digit OTP code via email
4. User enters the code and their new password
5. Password is updated and user can sign in

**Configuration Required for Password Reset:**

- `RESEND_API_KEY` - Resend API key for sending emails
- `RESEND_FROM_EMAIL` - Verified sender email (e.g., "Nixelo <notifications@nixelo.com>")

### 2. Google OAuth

Users can sign in using their Google account.

**Configuration Required:**
To enable Google OAuth, you need to:

1. Create a Google Cloud Project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add these environment variables to your Convex deployment:
   - `AUTH_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `AUTH_GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret

**Sign In Flow:**

1. User clicks "Sign in with Google" button
2. Redirected to Google for authentication
3. User grants permissions
4. Redirected back to Nixelo and logged in

## User Invitation System

Admins can invite new users to the platform via email.

### Who Can Send Invites?

Only platform admins can send invitations. A user is considered an admin if they:

- Have created at least one project, OR
- Have an "admin" role in any project

### Sending Invitations

1. Navigate to **Settings → Admin → User Management**
2. Click **"Invite User"** button
3. Enter the email address
4. Select a role (User or Admin)
5. Click **"Send Invitation"**

The invitation will be valid for 7 days.

### Invitation Roles

- **User**: Standard user access. Can create projects and collaborate.
- **Admin**: Can send invitations and manage other users.

### Managing Invitations

In the **User Management** interface, you can:

- **View all invitations** with their status (Pending, Accepted, Revoked, Expired)
- **Resend** pending invitations (extends expiration by 7 days)
- **Revoke** pending invitations (prevents them from being accepted)

### Accepting Invitations

**Invite Acceptance Flow:**

1. User clicks invite link → navigates to `/invite/:token`
2. Page displays invite details (inviter, role, company)
3. User signs up or signs in (if already has account)
4. After authentication, invite is automatically accepted
5. User is redirected to the company dashboard via `PostAuthRedirect`

**Route:** `src/routes/invite.$token.tsx`

**Components used:**

- `PostAuthRedirect` - handles post-auth navigation to company dashboard
- Invite page shows accept button for authenticated users

### Invitation States

| Status       | Description                                  |
| ------------ | -------------------------------------------- |
| **Pending**  | Invitation sent, waiting for acceptance      |
| **Accepted** | User created account and accepted invitation |
| **Revoked**  | Admin revoked the invitation                 |
| **Expired**  | Invitation expired after 7 days              |

## User Management

Admins can view all platform users in **Settings → Admin → User Management → Users** tab.

### User Information Displayed

- Name and email
- Profile picture
- Account type (Verified, Unverified)
- Projects created
- Project memberships

### User Types

- **Unverified**: Email not verified
- **Verified**: Email verified (via Google OAuth or email verification)

## Security Best Practices

1. **Regular Audit**: Periodically review active invitations and revoke unused ones
2. **Role Assignment**: Only grant admin role to trusted users
3. **Email Verification**: Encourage users to verify their email addresses
4. **Invite Expiration**: Invitations expire after 7 days for security

## API Reference

### Queries

```typescript
// Get invitation by token (public - no auth required)
await useQuery(api.invites.getInviteByToken, { token: "invite_xxx" });

// List all invitations (admin only)
await useQuery(api.invites.listInvites, { status: "pending" }); // optional filter

// List all users (admin only)
await useQuery(api.invites.listUsers, {});
```

### Mutations

```typescript
// Send an invitation (admin only)
await useMutation(api.invites.sendInvite, {
  email: "user@example.com",
  role: "user", // or "admin"
});

// Revoke an invitation (admin only)
await useMutation(api.invites.revokeInvite, {
  inviteId: "xxx",
});

// Resend an invitation (admin only)
await useMutation(api.invites.resendInvite, {
  inviteId: "xxx",
});

// Accept an invitation (authenticated user)
await useMutation(api.invites.acceptInvite, {
  token: "invite_xxx",
});
```

## Email Integration (TODO)

The `/invite/:token` page is implemented. To enable automatic invitation emails:

1. Configure Resend (already in dependencies):

   ```typescript
   // Add to environment variables
   RESEND_API_KEY = re_xxx;
   ```

2. Create email template in `convex/email/templates/invite.ts`

3. Update `sendInvite` mutation in `convex/invites.ts` to send email:
   ```typescript
   const inviteLink = `${process.env.SITE_URL}/invite/${token}`;
   await sendInviteEmail(args.email, inviteLink, invite.role);
   ```

## Troubleshooting

**Q: I can't send invitations**

- Verify you have admin privileges (created a project or have admin role)
- Check browser console for errors

**Q: Google sign-in doesn't work**

- Ensure `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET` are set
- Verify redirect URI in Google Console matches your app URL
- Check that Google+ API is enabled

**Q: Invitation shows as expired**

- Invitations are valid for 7 days
- Admin can resend the invitation to extend expiration

**Q: Can I change a user's role after they join?**

- Currently not implemented in UI
- Can be added as a future feature in UserManagement component

---

_Last Updated: 2026-01-10_
