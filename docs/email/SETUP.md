# Email Setup Guide

## Quick Start: Recommended Setup

The recommended setup uses different providers for different environments:

- **Development:** Resend (3k emails/month free, great developer experience)
- **Production:** SendPulse (15k emails/month free, cost-effective at scale)
- **E2E Testing:** Mailtrap (sandbox inbox, OTP verification for automated tests)

## Development Setup (Resend)

### 1. Sign Up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Sign up (free, no credit card required)
3. Verify your email

### 2. Get Your API Key

1. Dashboard → API Keys → Create API Key
2. Copy the key (starts with `re_`)

### 3. Set Environment Variables

In `.env.local` (see `.env.example` for all options):
- `RESEND_API_KEY` - your API key
- `RESEND_FROM_EMAIL` - use `dev@resend.dev` for testing

### 4. Test It

```bash
pnpm convex dev
# Trigger a mention or assignment to send a test email
```

## Production Setup (SendPulse)

### 1. Sign Up for SendPulse

1. Go to [https://sendpulse.com](https://sendpulse.com)
2. Sign up for a free account

### 2. Get API Credentials

1. Go to Settings → API
2. Copy your ID and Secret

### 3. Set Production Environment Variables

In Convex Dashboard → Settings → Environment Variables:
- `EMAIL_PROVIDER=sendpulse`
- `SENDPULSE_ID` / `SENDPULSE_SECRET` - your credentials
- `SENDPULSE_FROM_EMAIL` - your verified sender
- `SITE_URL` - your production domain

### 4. Deploy

```bash
pnpm convex deploy
```

## Provider Selection Logic

The system checks `EMAIL_PROVIDER` environment variable:

| Environment | EMAIL_PROVIDER | Provider Used | Cost |
|-------------|----------------|---------------|------|
| Development | (not set) | Resend | Free (3k/month) |
| Production | `sendpulse` | SendPulse | Free (15k/month) |
| Production | `mailgun` | Mailgun | Free (1k/month) |
| Production | `sendgrid` | SendGrid | Free (100/day) |

## E2E Testing Setup (Mailtrap)

Mailtrap provides a sandbox inbox where emails can be captured and read programmatically - perfect for E2E tests that need to verify OTP codes.

### 1. Sign Up for Mailtrap

1. Go to [https://mailtrap.io](https://mailtrap.io)
2. Sign up (free tier: 1000 emails/month)
3. Go to **Email Testing** → **Inboxes**

### 2. Get Your Credentials

**For sending emails (SMTP or API):**
1. Click on your inbox → **SMTP Settings**
2. Copy the SMTP credentials OR
3. Go to **API** tab for API-based sending

**For reading emails in E2E tests:**
1. Go to **Settings** → **API Tokens** → Create token
2. Get Account ID and Inbox ID from the URL:
   ```
   https://mailtrap.io/inboxes/INBOX_ID/messages
   https://mailtrap.io/accounts/ACCOUNT_ID/...
   ```

### 3. Set Environment Variables

```bash
# Mailtrap API (for sending via sandbox API)
MAILTRAP_API_TOKEN=your_api_token
MAILTRAP_INBOX_ID=your_inbox_id
MAILTRAP_FROM_EMAIL="Nixelo <test@nixelo.com>"

# For E2E tests to read the inbox
MAILTRAP_ACCOUNT_ID=your_account_id
```

### 4. How It Works

1. **Auth sends OTP** → Email goes to Mailtrap sandbox inbox
2. **E2E test polls** → Uses Mailtrap API to fetch emails
3. **Extract OTP** → Regex extracts the 8-digit code
4. **Complete signup** → Test enters OTP to verify

### 5. Usage in E2E Tests

```typescript
import { waitForVerificationEmail, clearInbox } from "./utils/mailtrap";

test("signup with email verification", async ({ page }) => {
  // Clear inbox before test
  await clearInbox();

  // Fill signup form
  await page.fill('[name="email"]', "test@example.com");
  await page.click('button[type="submit"]');

  // Wait for OTP email and extract code
  const otp = await waitForVerificationEmail("test@example.com", {
    timeout: 30000,
    pollInterval: 2000,
  });

  // Enter OTP
  await page.fill('[name="otp"]', otp);
  await page.click('button[type="submit"]');
});
```

See [E2E Testing Docs](../testing/e2e.md#mailtrap-otp-verification) for more details.

## Alternative Providers

### Mailgun Setup

```bash
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=Nixelo <notifications@yourdomain.com>
MAILGUN_REGION=us  # or 'eu' for EU region
```

### SendGrid Setup

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=Nixelo <notifications@yourdomain.com>
```

## Provider Rotation (Advanced)

The email system integrates with `serviceProviders` and `serviceUsage` tables to automatically rotate between providers based on free tier usage.

### How It Works

1. System queries available providers
2. Checks free tier remaining for each
3. Selects provider with most free capacity
4. Falls back to paid tier when free exhausted

### Enable Provider Rotation

Set up multiple providers in environment variables:

```bash
# Primary (checked first)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Nixelo <notifications@yourdomain.com>

# Secondary (fallback)
SENDPULSE_ID=your_id
SENDPULSE_SECRET=your_secret
SENDPULSE_FROM_EMAIL=Nixelo <notifications@yourdomain.com>

# Tertiary
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
```

## Testing

### Preview Emails Locally

```bash
# Start React Email development server
npx react-email dev
```

Visit http://localhost:3000 to preview all email templates.

### Send Test Email

Create a test action in Convex:

```typescript
export const testEmail = action({
  args: { to: v.string() },
  handler: async (ctx, args) => {
    return await sendEmail({
      to: args.to,
      subject: "Test Email from Nixelo",
      html: "<p>This is a test email!</p>",
    });
  },
});
```

### Test Different Providers

```bash
# Test Resend (development)
export EMAIL_PROVIDER=""
pnpm convex dev

# Test SendPulse (simulate production)
export EMAIL_PROVIDER=sendpulse
pnpm convex dev
```

## Domain Verification

For production emails to be delivered reliably:

### Resend
1. Dashboard → Domains → Add Domain
2. Add DNS records (SPF, DKIM, DMARC)
3. Wait for verification

### SendPulse
1. Settings → Sender Addresses
2. Verify your sender email
3. Or verify entire domain via DNS

### Mailgun
1. Sending → Domains → Add New Domain
2. Add DNS records
3. Verify domain

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_PROVIDER` | No | Provider selection (resend/sendpulse/mailgun/sendgrid) |
| `SITE_URL` | Yes | Application URL for email links |
| `RESEND_API_KEY` | For Resend | Resend API key |
| `RESEND_FROM_EMAIL` | For Resend | From address |
| `SENDPULSE_ID` | For SendPulse | SendPulse client ID |
| `SENDPULSE_SECRET` | For SendPulse | SendPulse client secret |
| `SENDPULSE_FROM_EMAIL` | For SendPulse | From address |
| `MAILGUN_API_KEY` | For Mailgun | Mailgun API key |
| `MAILGUN_DOMAIN` | For Mailgun | Mailgun sending domain |
| `MAILGUN_FROM_EMAIL` | For Mailgun | From address |
| `MAILGUN_REGION` | For Mailgun | 'us' or 'eu' |
| `SENDGRID_API_KEY` | For SendGrid | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | For SendGrid | From address |
| `MAILTRAP_API_TOKEN` | For Mailtrap | Mailtrap API token (for sending & reading) |
| `MAILTRAP_ACCOUNT_ID` | For Mailtrap | Mailtrap account ID (for E2E inbox reading) |
| `MAILTRAP_INBOX_ID` | For Mailtrap | Mailtrap inbox ID |
| `MAILTRAP_FROM_EMAIL` | For Mailtrap | From address for test emails |

## Troubleshooting

### Emails not sending in development

- Check `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Verify domain (or use `resend.dev` for testing)

### Emails not sending in production

- Check `EMAIL_PROVIDER` matches your setup
- Check provider-specific credentials are set
- Check provider dashboard for API errors
- Verify sender email/domain with provider

### Wrong provider being used

- Check `EMAIL_PROVIDER` environment variable
- Restart Convex after changing env vars
- Check Convex logs for which provider initialized

## FAQ

**Q: Can I use Resend in production too?**
A: Yes! Just don't set `EMAIL_PROVIDER` and it will default to Resend.

**Q: Can I test SendPulse locally?**
A: Yes! Set `EMAIL_PROVIDER=sendpulse` in your local Convex environment.

**Q: Do I need all provider keys set at once?**
A: No, only set keys for providers you're using. The system handles missing keys gracefully.

**Q: Can I switch providers without redeploying?**
A: Yes! Change the `EMAIL_PROVIDER` environment variable in Convex dashboard.

---

**Related Documentation:**
- [Email Overview](./README.md)
- [Convex Email Module](../../convex/email/)

---

*Last Updated: 2025-12-01*
