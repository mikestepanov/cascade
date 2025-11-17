# Email Notification System

This directory contains the email notification system for Cascade.

## Features

- ✅ Provider-agnostic architecture (easy to switch email services)
- ✅ React Email templates (type-safe, component-based)
- ✅ User preferences (granular control over email notifications)
- ✅ Automatic email sending on events (mentions, assignments, comments)
- ✅ Beautiful HTML emails with consistent branding

## Architecture

```
convex/email/
├── provider.ts          # Email provider interface
├── resend.ts            # Resend implementation (default)
├── sendpulse.ts         # SendPulse stub (future)
├── index.ts             # Main entry point (switch provider here)
├── notifications.ts     # Notification email functions
├── helpers.ts           # Helper to trigger emails from mutations
└── README.md            # This file

emails/
├── _components/
│   └── Layout.tsx       # Base email layout
├── MentionEmail.tsx     # @mention notification
├── AssignmentEmail.tsx  # Assignment notification
└── CommentEmail.tsx     # Comment notification
```

## Setup

### 1. Install Dependencies

Already installed:
- `resend` - Email service SDK
- `@react-email/components` - Email UI components
- `@react-email/render` - Render React to HTML

### 2. Choose an Email Provider

**Option A: Resend (Default)**
1. Sign up at [https://resend.com](https://resend.com)
2. Get your API key from Dashboard → API Keys
3. Set environment variables:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Cascade <notifications@yourdomain.com>
APP_URL=https://yourdomain.com
```

**Option B: SendPulse**
1. Sign up at [https://sendpulse.com](https://sendpulse.com)
2. Get API credentials from Settings → API
3. Set environment variables:
```bash
EMAIL_PROVIDER=sendpulse
SENDPULSE_ID=your_id
SENDPULSE_SECRET=your_secret
SENDPULSE_FROM_EMAIL=Cascade <notifications@yourdomain.com>
APP_URL=https://yourdomain.com
```

**Option C: Use different providers in different environments**
- Set different env vars in development vs production Convex environments
- Provider switches automatically based on `EMAIL_PROVIDER`

### 3. Deploy Schema Changes

The `notificationPreferences` table was added to the schema. Deploy to Convex:

```bash
pnpm convex deploy
```

## Usage

### Automatic Emails

Emails are sent automatically when:
- User is @mentioned in a comment → Mention email
- User is assigned to an issue → Assignment email
- Someone comments on user's issue → Comment email

### User Preferences

Users can control email notifications via `notificationPreferences` table:

```typescript
{
  emailEnabled: boolean,        // Master toggle
  emailMentions: boolean,       // @mentions
  emailAssignments: boolean,    // Assignments
  emailComments: boolean,       // Comments on my issues
  emailStatusChanges: boolean,  // Status changes (future)
  emailDigest: "none" | "daily" | "weekly",  // Digests (future)
}
```

**Default preferences:**
- `emailEnabled`: true
- `emailMentions`: true
- `emailAssignments`: true
- `emailComments`: true
- `emailStatusChanges`: false
- `emailDigest`: "none"

### Manual Email Sending

From a mutation or action:

```typescript
import { sendEmail } from "./email";

await sendEmail({
  to: "user@example.com",
  subject: "Test Email",
  html: "<p>Hello!</p>",
  text: "Hello!",
});
```

### Creating Custom Email Templates

1. Create a new file in `emails/` directory:

```tsx
// emails/MyCustomEmail.tsx
import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_components/Layout";

export function MyCustomEmail({ userName }: { userName: string }) {
  return (
    <EmailLayout preview="Custom notification">
      <Heading>Hello {userName}!</Heading>
      <Text>Your custom message here.</Text>
      <Button href="https://app.cascade.com">View App</Button>
    </EmailLayout>
  );
}

export default MyCustomEmail;
```

2. Use in a Convex action:

```typescript
import { render } from "@react-email/render";
import { MyCustomEmail } from "../../emails/MyCustomEmail";

const html = await render(MyCustomEmail({ userName: "Alice" }));
await sendEmail({ to: "alice@example.com", subject: "Custom", html });
```

## Switching Email Providers

The system is designed to be provider-agnostic. To switch from Resend to SendPulse (or any other service):

### Option 1: Use Existing SendPulse Stub

1. Install SendPulse SDK:
```bash
pnpm add sendpulse-api
```

2. Implement `sendpulse.ts` (see file for commented example)

3. Update `convex/email/index.ts`:
```typescript
import { SendPulseProvider } from "./sendpulse";
const provider = new SendPulseProvider();
```

4. Set environment variables:
```bash
SENDPULSE_ID=xxx
SENDPULSE_SECRET=xxx
SENDPULSE_FROM_EMAIL=notifications@yourdomain.com
```

### Option 2: Create Custom Provider

1. Create `convex/email/myprovider.ts`:
```typescript
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

export class MyProvider implements EmailProvider {
  isConfigured() { /* ... */ }
  async send(params: EmailSendParams): Promise<EmailSendResult> { /* ... */ }
}
```

2. Update `convex/email/index.ts`:
```typescript
import { MyProvider } from "./myprovider";
const provider = new MyProvider();
```

## Testing

### Preview Emails Locally

```bash
# Start React Email development server
npx react-email dev
```

Visit http://localhost:3000 to preview all email templates.

### Send Test Email

Create a test action:

```typescript
export const testEmail = action({
  args: { to: v.string() },
  handler: async (ctx, args) => {
    return await sendEmail({
      to: args.to,
      subject: "Test Email",
      html: "<p>This is a test!</p>",
    });
  },
});
```

## Troubleshooting

**Emails not sending:**
1. Check `RESEND_API_KEY` is set in Convex environment
2. Check domain is verified in Resend dashboard
3. Check Convex logs for error messages
4. Verify user has `emailEnabled: true` in preferences

**Emails going to spam:**
1. Verify your domain in Resend
2. Set up SPF and DKIM records
3. Use a professional "from" address (not @gmail.com)
4. Avoid spam trigger words in subject/body

**Template styling broken:**
1. Email clients have limited CSS support
2. Use inline styles (React Email handles this automatically)
3. Test in multiple email clients (Gmail, Outlook, Apple Mail)
4. Use [https://www.emailonacid.com/](https://www.emailonacid.com/) for testing

## Future Enhancements

- [ ] Daily/weekly digest emails
- [ ] Unsubscribe functionality
- [ ] Email open/click tracking
- [ ] A/B testing for email content
- [ ] Rich text formatting in emails
- [ ] Attachment support
- [ ] Email templates in admin panel

## Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email)
- [SendPulse API Docs](https://sendpulse.com/integrations/api)
- [Email Client CSS Support](https://www.caniemail.com/)
