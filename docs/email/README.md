# Email Notification System

This document provides an overview of the email notification system for Nixelo.

## Features

- **Provider-agnostic architecture** - Easy to switch between email services
- **React Email templates** - Type-safe, component-based email templates
- **User preferences** - Granular control over email notifications
- **Automatic triggers** - Emails sent on mentions, assignments, comments
- **Provider rotation** - Automatic free tier optimization across providers

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Nixelo App                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  Mutations  │───►│   Helpers   │───►│  Email Service      │  │
│  │  (issues,   │    │  (helpers.ts)    │  (index.ts)         │  │
│  │  comments)  │    └─────────────┘    └──────────┬──────────┘  │
│  └─────────────┘                                  │             │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────┐
                    │         Provider Selection    │               │
                    │  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
                    │  │ Resend  │  │SendPulse│  │ Mailgun │  ...  │
                    │  └─────────┘  └─────────┘  └─────────┘       │
                    └───────────────────────────────────────────────┘
```

## Directory Structure

```
convex/email/
├── index.ts             # Main entry point, provider selection
├── provider.ts          # EmailProvider interface
├── helpers.ts           # Helper functions for mutations
├── notifications.ts     # Notification email functions
├── digests.ts           # Daily/weekly digest emails
├── resend.ts            # Resend provider implementation
├── sendpulse.ts         # SendPulse provider implementation
├── mailgun.ts           # Mailgun provider implementation
└── sendgrid.ts          # SendGrid provider stub

emails/
├── _components/
│   └── Layout.tsx       # Base email layout component
├── MentionEmail.tsx     # @mention notification template
├── AssignmentEmail.tsx  # Assignment notification template
├── CommentEmail.tsx     # Comment notification template
└── DigestEmail.tsx      # Digest email template
```

## Supported Providers

| Provider | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| **Resend** | 3,000/month | $20/month for 50k | Development, startups |
| **SendPulse** | 15,000/month | $10/month for 50k | Production, scale |
| **Mailgun** | 1,000/month | Pay as you go | Transactional email |
| **SendGrid** | 100/day (~3k/month) | $15/month for 40k | Enterprise |

## Email Types

### Automatic Notifications

| Event | Email Type | Template |
|-------|------------|----------|
| User @mentioned in comment | Mention notification | `MentionEmail.tsx` |
| User assigned to issue | Assignment notification | `AssignmentEmail.tsx` |
| Comment on user's issue | Comment notification | `CommentEmail.tsx` |
| Daily/weekly summary | Digest email | `DigestEmail.tsx` |

### User Preferences

Users can control notifications via the `notificationPreferences` table:

```typescript
{
  emailEnabled: boolean,        // Master toggle
  emailMentions: boolean,       // @mentions
  emailAssignments: boolean,    // Assignments
  emailComments: boolean,       // Comments on my issues
  emailStatusChanges: boolean,  // Status changes
  emailDigest: "none" | "daily" | "weekly",
}
```

## Quick Start

1. **Choose a provider** - Resend recommended for development
2. **Set environment variables** - See [SETUP.md](./SETUP.md)
3. **Deploy** - `pnpm convex deploy`

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Usage

### Automatic Emails

Emails are sent automatically when events occur. The system checks user preferences before sending.

### Manual Email Sending

```typescript
import { sendEmail } from "./email";

await sendEmail({
  to: "user@example.com",
  subject: "Test Email",
  html: "<p>Hello!</p>",
  text: "Hello!",
});
```

### Creating Custom Templates

```tsx
// emails/MyCustomEmail.tsx
import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_components/Layout";

export function MyCustomEmail({ userName }: { userName: string }) {
  return (
    <EmailLayout preview="Custom notification">
      <Heading>Hello {userName}!</Heading>
      <Text>Your custom message here.</Text>
      <Button href="https://app.nixelo.com">View App</Button>
    </EmailLayout>
  );
}
```

## Troubleshooting

**Emails not sending:**
- Check API key is set in Convex environment variables
- Check domain is verified with your provider
- Check Convex logs for error messages
- Verify user has `emailEnabled: true` in preferences

**Emails going to spam:**
- Verify your domain with your email provider
- Set up SPF and DKIM records
- Use a professional "from" address

---

**Related Documentation:**
- [Setup Guide](./SETUP.md)
- [Convex Email Module](../../convex/email/)
- [Email Templates](../../emails/)

---

*Last Updated: 2025-11-27*
