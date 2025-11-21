# Authentication & User Management

> **Last Updated:** 2025-11-20
> **Version:** 1.1 - User Invitations & Google OAuth Support Added

This document describes the authentication and user management features in Cascade.

## Authentication Methods

Cascade supports three authentication methods:

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
4. Redirected back to Cascade and logged in

### 3. Anonymous Authentication
Users can sign in anonymously without providing any credentials.

**Note:** Anonymous users have limited functionality and should upgrade to a full account.

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

**Current Implementation:**
Users need to sign up with the exact email address that received the invitation. After signing up:

1. User creates account with email/password or Google
2. System automatically matches their email to pending invitations
3. User can call `acceptInvite` mutation with the token to activate their account

**Future Enhancement:**
You can add a dedicated invite acceptance page at `/invite/:token` that:
- Displays invite details (who invited them, role, etc.)
- Allows user to create account or sign in
- Automatically accepts the invite after authentication

### Invitation States

| Status | Description |
|--------|-------------|
| **Pending** | Invitation sent, waiting for acceptance |
| **Accepted** | User created account and accepted invitation |
| **Revoked** | Admin revoked the invitation |
| **Expired** | Invitation expired after 7 days |

## User Management

Admins can view all platform users in **Settings → Admin → User Management → Users** tab.

### User Information Displayed

- Name and email
- Profile picture
- Account type (Anonymous, Verified, Unverified)
- Projects created
- Project memberships

### User Types

- **Anonymous**: Signed in anonymously, no email
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
  role: "user" // or "admin"
});

// Revoke an invitation (admin only)
await useMutation(api.invites.revokeInvite, {
  inviteId: "xxx"
});

// Resend an invitation (admin only)
await useMutation(api.invites.resendInvite, {
  inviteId: "xxx"
});

// Accept an invitation (authenticated user)
await useMutation(api.invites.acceptInvite, {
  token: "invite_xxx"
});
```

## Email Integration (TODO)

Currently, invitation emails are not sent automatically. To implement email sending:

1. Configure Resend (already in dependencies):
   ```typescript
   // Add to environment variables
   RESEND_API_KEY=re_xxx
   ```

2. Create email template in `convex/email/templates/invite.ts`

3. Update `sendInvite` mutation in `convex/invites.ts` to send email:
   ```typescript
   const inviteLink = `${process.env.SITE_URL}/invite/${token}`;
   await sendInviteEmail(args.email, inviteLink, invite.role);
   ```

4. Create `/invite/:token` page in the frontend to handle invite acceptance

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
