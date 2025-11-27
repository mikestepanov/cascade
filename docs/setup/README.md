# Setup & Configuration Guide

Manual setup tasks that can't be automated through code.

---

## Quick Start

```bash
pnpm install
pnpm run dev:backend   # Start Convex
pnpm run dev:frontend  # Start Vite
```

**Optional:**
- Configure email provider for notifications
- Configure Google OAuth for calendar/auth
- Configure Pumble webhooks for chat notifications

---

## Environment Variables

Copy to `.env.local`:

```bash
# EMAIL (Required for notifications)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="Nixelo <notifications@yourdomain.com>"
APP_URL=http://localhost:5173

# GOOGLE OAUTH (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GITHUB OAUTH (Optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# ANALYTICS (Optional)
VITE_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Production:** Set `APP_URL` to your production domain.

**CI/CD:** Get `CONVEX_DEPLOY_KEY` from Convex Dashboard → Settings → Deploy Keys.

---

## Email Setup (Resend)

1. Sign up at https://resend.com
2. Get API key from dashboard
3. Add `RESEND_API_KEY` to environment
4. For production: verify your domain

**Test:** Create an issue, assign it to yourself, check for email.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project, enable Google Calendar API
3. Create OAuth 2.0 credentials (Web application)
4. Add redirect URIs:
   - `http://localhost:5173/auth/callback` (dev)
   - `https://yourdomain.com/auth/callback` (prod)
5. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to environment

---

## Pumble Integration

1. In Pumble: Channel → Integrations → Incoming Webhooks
2. Copy webhook URL
3. In Nixelo: Settings → Integrations → Pumble → Add Webhook
4. Test with "Test Webhook" button

---

## GitHub OAuth Setup

1. GitHub Settings → Developer settings → OAuth Apps → New
2. Homepage URL: your app URL
3. Callback URL: `{your-url}/auth/github/callback`
4. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to environment

---

## Running Tests

```bash
# Frontend tests
pnpm test

# Backend tests
pnpm test:backend

# Type checking
pnpm run typecheck
```

---

## Deployment

```bash
# Deploy Convex backend
npx convex deploy

# Build frontend
pnpm run build
```

**Vercel:**
- Build command: `npx convex deploy --cmd 'pnpm run build'`
- Output directory: `dist`
- Add environment variables in Vercel dashboard

---

## Feature Status

| Feature | Status | Setup Required |
|---------|--------|----------------|
| Email Notifications | ✅ | Resend API key |
| REST API | ✅ | None (generate keys in Settings) |
| Pumble Integration | ✅ | Webhook URL from Pumble |
| Google Calendar | 🟡 | Google Cloud OAuth (sync pending) |
| GitHub Integration | ✅ | GitHub OAuth app |
| Offline/PWA | ✅ | None |
| User Invitations | ✅ | Email provider |

---

*Last Updated: 2025-11-27*
