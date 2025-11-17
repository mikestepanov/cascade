# Email Setup Guide

## Quick Start: Best of Both Worlds (Resend + SendPulse)

The recommended setup is:
- **Development:** Use Resend (3k emails/month free, great DX)
- **Production:** Use SendPulse (15k emails/month free, cost-effective at scale)

### Step 1: Development Setup (Resend)

1. **Sign up for Resend** (free, no credit card):
   - Go to [https://resend.com](https://resend.com)
   - Sign up and verify your email

2. **Get your API key:**
   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_`)

3. **Set development environment variables:**

In your **local Convex environment** (development):
```bash
# In Convex dashboard → Settings → Environment Variables
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Cascade <dev@resend.dev>  # Use resend.dev for testing
APP_URL=http://localhost:5173
# Leave EMAIL_PROVIDER blank (defaults to Resend)
```

4. **Test it:**
```bash
pnpm convex dev
# Trigger a mention or assignment to send a test email
```

### Step 2: Production Setup (SendPulse)

1. **Sign up for SendPulse** (free tier):
   - Go to [https://sendpulse.com](https://sendpulse.com)
   - Sign up for free account

2. **Get API credentials:**
   - Go to Settings → API
   - Copy your ID and Secret

3. **Implement SendPulse provider** (see below)

4. **Set production environment variables:**

In your **production Convex environment**:
```bash
# In Convex dashboard → Production → Settings → Environment Variables
EMAIL_PROVIDER=sendpulse  # This switches to SendPulse
SENDPULSE_ID=your_id_here
SENDPULSE_SECRET=your_secret_here
SENDPULSE_FROM_EMAIL=Cascade <notifications@yourdomain.com>
APP_URL=https://yourdomain.com
```

5. **Deploy:**
```bash
pnpm convex deploy
```

## How It Works

The system checks the `EMAIL_PROVIDER` environment variable:

```typescript
// convex/email/index.ts
const provider: EmailProvider =
  process.env.EMAIL_PROVIDER === "sendpulse"
    ? new SendPulseProvider()
    : new ResendProvider(); // Default
```

| Environment | EMAIL_PROVIDER | Provider Used | Cost |
|-------------|----------------|---------------|------|
| Development | (not set) | Resend | Free (3k/month) |
| Production | `sendpulse` | SendPulse | Free (15k/month) |

## Implementing SendPulse Provider

Currently, SendPulse is a stub. To implement it:

### Option 1: Use SendPulse SMTP API

```typescript
// convex/email/sendpulse.ts
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

export class SendPulseProvider implements EmailProvider {
  private apiUrl = "https://api.sendpulse.com";
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    // Will authenticate on first send
  }

  isConfigured(): boolean {
    return !!process.env.SENDPULSE_ID && !!process.env.SENDPULSE_SECRET;
  }

  async getToken(): Promise<string> {
    // Check if token is still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Get new token
    const response = await fetch(`${this.apiUrl}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: process.env.SENDPULSE_ID,
        client_secret: process.env.SENDPULSE_SECRET,
      }),
    });

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.token;
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    const token = await this.getToken();
    const from = params.from || process.env.SENDPULSE_FROM_EMAIL || "Cascade <noreply@cascade.app>";

    const response = await fetch(`${this.apiUrl}/smtp/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: {
          from: { email: from },
          to: Array.isArray(params.to)
            ? params.to.map(email => ({ email }))
            : [{ email: params.to }],
          subject: params.subject,
          html: params.html,
          text: params.text,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("SendPulse error:", error);
      return {
        id: "",
        success: false,
        error: `SendPulse API error: ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      id: result.id || "",
      success: true,
    };
  }
}
```

### Option 2: Use SendPulse NPM Package

```bash
pnpm add sendpulse-api
```

```typescript
// convex/email/sendpulse.ts
import sendpulse from "sendpulse-api";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

export class SendPulseProvider implements EmailProvider {
  private initialized = false;

  constructor() {
    if (this.isConfigured()) {
      sendpulse.init(
        process.env.SENDPULSE_ID!,
        process.env.SENDPULSE_SECRET!,
        "/tmp/sendpulse-token"
      );
      this.initialized = true;
    }
  }

  isConfigured(): boolean {
    return !!process.env.SENDPULSE_ID && !!process.env.SENDPULSE_SECRET;
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    if (!this.initialized) {
      return { id: "", success: false, error: "SendPulse not configured" };
    }

    return new Promise((resolve) => {
      sendpulse.smtpSendMail((data: any) => {
        if (data.result) {
          resolve({ id: data.id || "", success: true });
        } else {
          resolve({ id: "", success: false, error: data.message });
        }
      }, {
        from: {
          email: params.from || process.env.SENDPULSE_FROM_EMAIL || "noreply@cascade.app",
        },
        to: Array.isArray(params.to)
          ? params.to.map(email => ({ email }))
          : [{ email: params.to }],
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
    });
  }
}
```

## Testing Both Providers

### Test Resend (Development)
```bash
# Set local env vars
export EMAIL_PROVIDER=""  # Leave blank for Resend
pnpm convex dev

# In your app, trigger a notification
# Check your email inbox
```

### Test SendPulse (Production Simulation)
```bash
# Set env vars to simulate production
export EMAIL_PROVIDER=sendpulse
pnpm convex dev

# Trigger a notification
# Check your email inbox
```

## Cost Comparison

| Provider | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| **Resend** | 3,000/month | $20/month for 50k | Development, startups |
| **SendPulse** | 15,000/month | $10/month for 50k | Production, scale |
| **SendGrid** | 100/day (3k/month) | $15/month for 40k | Enterprise |

## Switching Workflow

```bash
# Development → Production
1. Develop with Resend (3k emails free)
2. Test everything locally
3. Implement SendPulse provider
4. Set EMAIL_PROVIDER=sendpulse in production
5. Deploy to production with 15k emails free

# If you outgrow SendPulse free tier:
1. Upgrade SendPulse ($10/month for 50k)
2. Or switch back to Resend paid ($20/month for 50k)
3. No code changes needed - just env vars!
```

## Troubleshooting

**Emails not sending in development:**
- Check `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Verify domain in Resend (or use resend.dev for testing)

**Emails not sending in production:**
- Check `EMAIL_PROVIDER=sendpulse` is set
- Check `SENDPULSE_ID` and `SENDPULSE_SECRET` are set
- Check SendPulse dashboard for API errors
- Verify sender email is verified in SendPulse

**Wrong provider being used:**
- Check `EMAIL_PROVIDER` environment variable
- Restart Convex after changing env vars
- Check Convex logs for which provider initialized

## FAQ

**Q: Can I use Resend in production too?**
A: Yes! Just don't set `EMAIL_PROVIDER` and it will default to Resend. Good if you prefer consistency.

**Q: Can I test SendPulse locally?**
A: Yes! Set `EMAIL_PROVIDER=sendpulse` in your local Convex environment.

**Q: What if I want to use a different provider like SendGrid?**
A: Create a `SendGridProvider` class, implement the `EmailProvider` interface, and add it to the switch statement in `convex/email/index.ts`.

**Q: Do I need both API keys set at once?**
A: No, only set the keys for the provider you're using. The system gracefully handles missing keys.

**Q: Can I switch providers without redeploying?**
A: Yes! Just change the `EMAIL_PROVIDER` environment variable in your Convex dashboard. Convex will pick up the change automatically.
