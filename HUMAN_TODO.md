# Human TODO - Manual Setup & Configuration

> **Last Updated:** 2025-11-18
> **Version:** 2.2 - Updated for Pumble & API Keys

This document contains tasks that require **manual human intervention** - things that can't be automated through code. These are configuration, setup, and deployment tasks.

---

## 🚀 Quick Start Checklist

**Minimum Required to Run Cascade:**
1. [ ] Install dependencies: `pnpm install`
2. [ ] Start Convex dev: `pnpm run dev:backend`
3. [ ] Start frontend: `pnpm run dev:frontend`
4. [ ] (Optional) Configure email provider for notifications
5. [ ] (Optional) Configure integrations (Google Calendar, Pumble)
6. [ ] (Optional) Install testing dependencies for backend tests

**To Enable Email Notifications:**
1. [ ] Sign up for email provider (Resend or SendPulse)
2. [ ] Get API credentials
3. [ ] Add to `.env.local` (see template below)
4. [ ] Set `APP_URL` environment variable
5. [ ] Test email sending

---

## 📋 Complete Environment Variables Template

**Copy this to `.env.local` for local development:**

```bash
# ============================================
# EMAIL NOTIFICATIONS
# ============================================

# Email Provider: "resend" (default) or "sendpulse"
EMAIL_PROVIDER=resend

# --- Resend (Option A - Recommended for Getting Started) ---
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="Cascade <notifications@yourdomain.com>"

# --- SendPulse (Option B - Better Free Tier) ---
# Uncomment if using SendPulse instead of Resend
# SENDPULSE_ID=your_sendpulse_id
# SENDPULSE_SECRET=your_sendpulse_secret
# SENDPULSE_FROM_EMAIL="Cascade <notifications@yourdomain.com>"

# Application URL (for links in emails)
# Local: http://localhost:5173
# Production: https://yourdomain.com
APP_URL=http://localhost:5173

# ============================================
# ANALYTICS (Optional)
# ============================================

# PostHog Analytics (Optional)
# VITE_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
# VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# ============================================
# AUTHENTICATION (Optional - OAuth)
# ============================================

# Google OAuth (Optional)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth (Optional)
# GITHUB_CLIENT_ID=your_github_client_id
# GITHUB_CLIENT_SECRET=your_github_client_secret
```

**For Production/Vercel:**
- Add same variables to your deployment platform's environment settings
- **CRITICAL:** Update `APP_URL` to your production domain

**For CI/CD:**
```bash
# Required for deploying Convex from CI/CD
CONVEX_DEPLOY_KEY=your_convex_deploy_key_from_dashboard
```

**Getting Convex Deploy Key:**
1. Go to https://dashboard.convex.dev/d/peaceful-salmon-964
2. Settings → Deploy Keys
3. Create new deploy key
4. Copy and add to CI/CD environment variables

---

## 🔐 Email Notifications Setup (Required for Production)

### 1. Choose and Configure Email Provider

**Decision Required:** Which email provider to use?

#### Option A: Resend (Recommended for Getting Started)
- **Pros:** Simple, React Email built-in, great DX, generous free tier
- **Free Tier:** 3,000 emails/month, 100 emails/day
- **Paid:** $20/month for 50,000 emails
- **Setup:**
  1. [ ] Sign up at https://resend.com
  2. [ ] Verify domain (or use resend.dev for testing)
  3. [ ] Get API key from dashboard
  4. [ ] Add to environment variables (see below)

#### Option B: SendPulse (Better Free Tier for Growth)
- **Pros:** 15,000 emails/month free, established service
- **Free Tier:** 15,000 emails/month to 500 subscribers
- **Setup:**
  1. [ ] Sign up at https://sendpulse.com
  2. [ ] Get API credentials (ID + Secret)
  3. [ ] Set `EMAIL_PROVIDER=sendpulse` in environment
  4. [ ] Add credentials to environment variables

### 2. Set Environment Variables

**Local Development** (`.env.local`):
```bash
# Email Provider (choose one)
EMAIL_PROVIDER=resend  # or "sendpulse"

# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="Cascade <notifications@yourdomain.com>"

# OR SendPulse Configuration
# SENDPULSE_ID=your_sendpulse_id
# SENDPULSE_SECRET=your_sendpulse_secret
# SENDPULSE_FROM_EMAIL="Cascade <notifications@yourdomain.com>"

# Application URL (for email links)
APP_URL=http://localhost:5173
```

**Production** (Deployment Platform):
- [ ] Add `EMAIL_PROVIDER` to production environment
- [ ] Add email provider credentials (API key/ID/Secret)
- [ ] Add `RESEND_FROM_EMAIL` or `SENDPULSE_FROM_EMAIL`
- [ ] **CRITICAL:** Set `APP_URL` to production domain (e.g., `https://cascade.yourdomain.com`)

### 3. Domain Verification (Production Only)

**For Production Emails:**
- [ ] Verify your domain with your email provider
- [ ] Add SPF, DKIM records to DNS
- [ ] Configure sender email address (e.g., `notifications@yourdomain.com`)
- [ ] Test email deliverability

**Testing Without Domain:**
- Resend: Use `onboarding@resend.dev` (limited to 100 emails/day)
- SendPulse: Use default sender

### 4. Convex Deployment

**Deploy to Convex:**
```bash
# Deploy backend with environment variables
npx convex deploy

# Or deploy with custom command
npx convex deploy --cmd 'pnpm run build'
```

**Set Convex Environment Variables:**
- [ ] Go to Convex Dashboard → Settings → Environment Variables
- [ ] Add email provider credentials
- [ ] Add `APP_URL` for production
- [ ] Redeploy if needed

### 5. Test Email Sending

**Manual Testing Checklist:**
- [ ] Create a test issue and assign it to yourself
- [ ] Verify assignment email arrives
- [ ] @mention yourself in a comment
- [ ] Verify mention email arrives
- [ ] Add a comment to an issue you created
- [ ] Verify comment email arrives
- [ ] Check email formatting/styling
- [ ] Test unsubscribe link works
- [ ] Verify you stop receiving emails after unsubscribe

**Digest Testing:**
- [ ] Set digest preference to "daily" in notification settings
- [ ] Wait for next scheduled run (9am UTC) OR trigger manually
- [ ] Verify digest email arrives with recent notifications
- [ ] Check digest formatting
- [ ] Test unsubscribe link in digest

---

## 🌐 Frontend Integration (Optional)

### 6. Add Unsubscribe Route to App

**Required:** Add route handling for `/unsubscribe` page

- [ ] Update `src/App.tsx` to handle unsubscribe route
- [ ] Extract `token` from URL query parameter
- [ ] Render `UnsubscribePage` component with token
- [ ] Test navigation to `/unsubscribe?token=xxx`

**Example Implementation Needed:**
```tsx
// In App.tsx, add route handling for /unsubscribe
const urlParams = new URLSearchParams(window.location.search);
const unsubscribeToken = urlParams.get('token');

if (window.location.pathname === '/unsubscribe' && unsubscribeToken) {
  return <UnsubscribePage token={unsubscribeToken} />;
}
```

### 7. Add Notification Preferences to User Settings (Optional)

**Optional Enhancement:** Integrate notification preferences into user settings

- [ ] Create user settings page (`src/components/UserSettings.tsx`)
- [ ] Add "Notifications" tab
- [ ] Import and render `NotificationPreferences` component
- [ ] Add navigation link to settings in app header/menu
- [ ] Test preferences save/load

---

## 📧 Email Template Customization (Optional)

### 8. Customize Email Branding

**Optional:** Customize email templates with your branding

- [ ] Update `emails/_components/Layout.tsx` with your logo
- [ ] Customize colors in email templates
- [ ] Update footer text
- [ ] Test email rendering with `pnpm email dev` (if using React Email CLI)

---

## 🔔 Monitoring & Maintenance

### 9. Monitor Email Delivery

**Ongoing:**
- [ ] Monitor email bounce rates
- [ ] Check spam reports
- [ ] Monitor email delivery success in logs
- [ ] Set up alerts for email sending failures

### 10. Cost Monitoring

**Ongoing:**
- [ ] Track monthly email volume
- [ ] Monitor approaching free tier limits
- [ ] Plan for paid tier if needed
- [ ] Consider digest frequency to reduce email volume

---

## ✅ Production Readiness Checklist

Before launching email notifications to users:

- [ ] Email provider account created and verified
- [ ] Domain verified with email provider
- [ ] Environment variables set in production
- [ ] Convex backend deployed with latest code
- [ ] Test emails sent successfully
- [ ] Unsubscribe functionality tested
- [ ] Email formatting tested on multiple clients (Gmail, Outlook, Apple Mail)
- [ ] Digest emails tested
- [ ] Cron jobs verified running on schedule
- [ ] Monitoring/alerting set up
- [ ] Documentation updated for team

---

## 🔑 Authentication Setup (Required)

### 11. Convex Authentication

**Already Configured:** Password and Anonymous auth providers are set up.

**No Manual Setup Required** unless you want to add OAuth providers (Google, GitHub, etc.)

**Optional OAuth Setup:**
1. [ ] Choose OAuth provider (Google, GitHub, etc.)
2. [ ] Register OAuth application
3. [ ] Get client ID and client secret
4. [ ] Update `convex/auth.config.ts`
5. [ ] Add OAuth credentials to environment variables

**Reference:** See `convex/auth.config.ts` for current configuration

---

## 🔑 REST API & CLI Integration (Optional)

### 13. API Keys for REST API Access

**Status:** Code implemented ✅ | No OAuth required ✅ |Works out of the box ✅

The REST API allows programmatic access to Cascade from CLI tools, AI assistants, and external scripts.

**Features:**
- Generate API keys with custom scopes
- Rate limiting per key
- Usage statistics tracking
- Secure key storage (SHA-256 hashing)

**How to Use:**

1. **Generate an API Key:**
   - Go to Settings → API Keys
   - Click "Generate Key"
   - Enter a name (e.g., "Claude Code Integration")
   - Select scopes (e.g., `issues:read`, `issues:write`)
   - Set rate limit (default: 100 req/min)
   - Click "Generate"
   - **Important:** Copy the key immediately (shown only once!)

2. **Use the API Key:**
   ```bash
   # Example: List issues for a project
   curl -H "Authorization: Bearer sk_casc_your_key_here" \
     "https://yourdomain.com/api/issues?projectId=PROJECT_ID"
   ```

3. **Monitor Usage:**
   - Go to Settings → API Keys
   - Click "View Stats" on any key
   - See total calls, last 24h usage, success rate, response times

4. **Revoke/Delete Keys:**
   - Go to Settings → API Keys
   - Click "Revoke" to disable temporarily
   - Click "Delete" to remove permanently

**Available Scopes:**
- `issues:read` - View issues
- `issues:write` - Create/update issues
- `issues:delete` - Delete issues
- `projects:read` - View projects
- `documents:read` - View documents
- `*` - Full access (use with caution)

**Documentation:**
- See `docs/API.md` for complete API reference
- Includes examples for bash, Python, Node.js, and Claude Code

**No OAuth Setup Required** - API keys work immediately!

---

## 📢 Pumble Integration (Optional - Webhook Setup)

### 14. Pumble Team Chat Integration

**Status:** Code implemented ✅ | Webhook setup required 🔴

The Pumble integration sends notifications to Pumble channels when issues are created, updated, or assigned.

**Features:**
- Webhook-based (no OAuth needed)
- Event subscriptions (issue.created, issue.updated, etc.)
- Rich message formatting with colors
- Per-project or global webhooks
- Test message functionality

**Setup Steps:**

1. **Get Pumble Webhook URL:**
   - [ ] Open Pumble and go to the channel where you want notifications
   - [ ] Click channel name → "Integrations"
   - [ ] Click "Incoming Webhooks"
   - [ ] Click "Add Incoming Webhook"
   - [ ] Copy the Webhook URL (e.g., `https://api.pumble.com/workspaces/xxx/...`)

2. **Add Webhook in Cascade:**
   - [ ] Go to Settings → Integrations → Pumble
   - [ ] Click "Add Webhook"
   - [ ] Enter webhook name (e.g., "Team Notifications")
   - [ ] Paste the Pumble webhook URL
   - [ ] (Optional) Select a specific project
   - [ ] Choose events to subscribe to:
     - ✅ Issue Created
     - ✅ Issue Updated
     - ✅ Issue Assigned
     - ✅ Issue Completed
     - ☐ Issue Deleted
     - ☐ Comment Added
   - [ ] Configure notification settings:
     - ✅ Send notifications for @mentions
     - ✅ Send notifications for assignments
     - ✅ Send notifications for status changes
   - [ ] Click "Add Webhook"

3. **Test the Integration:**
   - [ ] Click "Test Webhook" button
   - [ ] Check your Pumble channel for test message
   - [ ] If successful, you'll see: "🎉 Cascade integration is working!"

4. **Monitor Usage:**
   - Webhook cards show:
     - Total messages sent
     - Last message time
     - Last error (if any)
   - Click "View Stats" for detailed usage

**Troubleshooting:**
- If test fails, verify webhook URL is correct
- Ensure webhook URL contains "pumble.com"
- Check webhook is active (toggle in settings)
- Check browser console for errors

**No OAuth Required** - Just add webhook URL and start receiving notifications!

---

## 🔗 GitHub & Google Integrations (Optional - OAuth Setup)

### 15. GitHub Integration Setup

**Status:** Code implemented ✅ | OAuth setup required 🔴

The GitHub integration is fully coded but requires OAuth app setup to work. This enables:
- Linking GitHub repositories to projects
- Tracking PRs and commits
- Auto-linking commits to issues (e.g., "fixes PROJ-123")
- PR status display on issues

**Setup Steps:**

1. **Create GitHub OAuth App:**
   - [ ] Go to GitHub Settings → Developer settings → OAuth Apps
   - [ ] Click "New OAuth App"
   - [ ] **Application name:** Cascade (or your app name)
   - [ ] **Homepage URL:** `http://localhost:5173` (dev) or `https://yourdomain.com` (prod)
   - [ ] **Authorization callback URL:** `http://localhost:5173/auth/github/callback` (dev) or `https://yourdomain.com/auth/github/callback` (prod)
   - [ ] Click "Register application"
   - [ ] Copy the Client ID
   - [ ] Generate a new client secret and copy it

2. **Add GitHub Credentials to Environment:**

   **Local Development** (`.env.local`):
   ```bash
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here
   ```

   **Production** (Convex Dashboard or Deployment Platform):
   - [ ] Add `GITHUB_CLIENT_ID` to environment variables
   - [ ] Add `GITHUB_CLIENT_SECRET` to environment variables
   - [ ] Redeploy Convex backend

3. **Update Auth Configuration:**
   - [ ] Open `convex/auth.config.ts`
   - [ ] Add GitHub provider (if not already added):
   ```typescript
   import GitHub from "@auth/core/providers/github";

   export default {
     providers: [
       // ... existing providers
       GitHub({
         clientId: process.env.GITHUB_CLIENT_ID,
         clientSecret: process.env.GITHUB_CLIENT_SECRET,
       }),
     ],
   };
   ```

4. **Set Up GitHub Webhook (Optional - for real-time sync):**
   - [ ] Go to your GitHub repository settings
   - [ ] Click "Webhooks" → "Add webhook"
   - [ ] **Payload URL:** `https://yourdomain.com/github/webhook`
   - [ ] **Content type:** application/json
   - [ ] **Secret:** Generate a random secret and save it
   - [ ] **Events:** Select "Pull requests", "Pushes", "Pull request reviews"
   - [ ] Click "Add webhook"

5. **Test GitHub Integration:**
   - [ ] Start dev server
   - [ ] Go to Settings → Integrations
   - [ ] Click "Connect GitHub"
   - [ ] Authorize the OAuth app
   - [ ] Verify connection shows your GitHub username
   - [ ] Link a repository to a project
   - [ ] Create a PR with issue key in title (e.g., "Fix bug PROJ-123")
   - [ ] Verify PR appears in Settings → Integrations

**Files to Reference:**
- Backend: `convex/github.ts` - All GitHub functions
- Frontend: `src/components/Settings.tsx` - GitHub integration UI
- Documentation: `INTEGRATIONS_README.md` - Full setup guide

---

### 16. Google Calendar Integration Setup

**Status:** Code implemented ✅ | OAuth setup required 🔴

The Google Calendar integration is fully coded but requires OAuth setup. This enables:
- Bi-directional calendar sync (Cascade ↔ Google Calendar)
- Import Google events to Cascade
- Export Cascade events to Google
- Auto-sync on schedule

**Setup Steps:**

1. **Create Google Cloud Project:**
   - [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
   - [ ] Create new project (or select existing)
   - [ ] Project name: "Cascade" (or your app name)

2. **Enable Google Calendar API:**
   - [ ] In Google Cloud Console, go to "APIs & Services" → "Library"
   - [ ] Search for "Google Calendar API"
   - [ ] Click "Enable"

3. **Create OAuth 2.0 Credentials:**
   - [ ] Go to "APIs & Services" → "Credentials"
   - [ ] Click "Create Credentials" → "OAuth client ID"
   - [ ] Configure consent screen if prompted:
     - User type: External (for public) or Internal (for workspace)
     - App name: Cascade
     - Add scopes: `https://www.googleapis.com/auth/calendar.readonly` and `https://www.googleapis.com/auth/calendar.events`
   - [ ] Application type: Web application
   - [ ] **Name:** Cascade Calendar Integration
   - [ ] **Authorized redirect URIs:**
     - Add: `http://localhost:5173/auth/google/callback` (dev)
     - Add: `https://yourdomain.com/auth/google/callback` (prod)
   - [ ] Click "Create"
   - [ ] Copy the Client ID and Client Secret

4. **Add Google Credentials to Environment:**

   **Local Development** (`.env.local`):
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

   **Production** (Convex Dashboard or Deployment Platform):
   - [ ] Add `GOOGLE_CLIENT_ID` to environment variables
   - [ ] Add `GOOGLE_CLIENT_SECRET` to environment variables
   - [ ] Redeploy Convex backend

5. **Update Auth Configuration:**
   - [ ] Open `convex/auth.config.ts`
   - [ ] Add Google provider (if not already added):
   ```typescript
   import Google from "@auth/core/providers/google";

   export default {
     providers: [
       // ... existing providers
       Google({
         clientId: process.env.GOOGLE_CLIENT_ID,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
         authorization: {
           params: {
             scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
             access_type: "offline",
             prompt: "consent",
           },
         },
       }),
     ],
   };
   ```

6. **Configure OAuth Consent Screen:**
   - [ ] Go to "APIs & Services" → "OAuth consent screen"
   - [ ] Fill in required information:
     - App name, support email, developer contact
     - App logo (optional)
     - Authorized domains
   - [ ] Add scopes:
     - `.../auth/calendar.readonly`
     - `.../auth/calendar.events`
   - [ ] Add test users if app is in testing mode
   - [ ] Submit for verification if going public

7. **Test Google Calendar Integration:**
   - [ ] Start dev server
   - [ ] Go to Settings → Integrations
   - [ ] Click "Connect Google"
   - [ ] Sign in with Google account
   - [ ] Grant calendar permissions
   - [ ] Verify connection shows your email
   - [ ] Enable sync
   - [ ] Choose sync direction (bidirectional recommended)
   - [ ] Create a test event in Cascade
   - [ ] Check if it appears in Google Calendar
   - [ ] Create a test event in Google Calendar
   - [ ] Check if it appears in Cascade

**Files to Reference:**
- Backend: `convex/googleCalendar.ts` - All Google Calendar functions
- Frontend: `src/components/Settings.tsx` - Google Calendar integration UI
- Documentation: `INTEGRATIONS_README.md` - Full setup guide

**Important Notes:**
- Refresh tokens expire after 7 days if app is in testing mode
- Submit app for verification to get refresh tokens that don't expire
- Sync runs on schedule (implement cron job in `convex/crons.ts`)
- Token refresh is handled automatically in `googleCalendar.ts`

---

### 17. Offline Mode Setup (No Setup Required!)

**Status:** Fully implemented ✅ | Works out of the box ✅

The offline mode and PWA features require **no manual setup** - they work automatically!

**Features Already Working:**
- ✅ Service Worker caching
- ✅ IndexedDB for offline data
- ✅ Offline mutation queue
- ✅ Auto-sync when online
- ✅ Network status tracking
- ✅ Installable as app (PWA)
- ✅ Offline fallback page

**No OAuth Required** - Unlike GitHub and Google, offline mode just works!

**To Test:**
1. Open app in browser
2. Open DevTools → Application → Service Workers
3. Check "Offline" to simulate offline mode
4. Navigate the app - cached content loads
5. Make changes - they're queued
6. Uncheck "Offline" - changes sync automatically
7. Go to Settings → Offline Mode to see queue status

**To Install as App:**
1. Chrome/Edge: Click install icon in address bar
2. Safari iOS: Share → Add to Home Screen
3. Android: Chrome menu → Install app

**Files to Reference:**
- Service Worker: `src/service-worker.ts`
- Offline utilities: `src/lib/offline.ts`
- React hooks: `src/hooks/useOffline.ts`
- Backend: `convex/offlineSync.ts`
- Settings UI: `src/components/Settings.tsx` (Offline Mode tab)

---

## 🧪 Backend Testing Setup (Required for Running Tests)

### 12. Install Backend Testing Dependencies

**Required for running Convex backend tests:**

```bash
# Install convex-test package
pnpm add -D convex-test@0.0.38

# OR if using npm
npm install --save-dev convex-test@0.0.38
```

**Note:** Version 0.0.38 is specifically required for compatibility with current test suite.

### 13. Configure Test Environment

**No additional environment variables needed for testing** - Tests run in isolated environment.

**Verify Setup:**
```bash
# Run backend tests
pnpm test:backend

# Or run specific test file
pnpm vitest convex/rbac.test.ts
```

**Existing Test Coverage:**
- ✅ 221 test cases across 9 modules
- ✅ Modules tested: rbac, projects, issues, documents, sprints, analytics, notifications, automationRules, webhooks
- ⚠️ 19 modules without tests yet (see TODO.md for details)

---

## 📊 Analytics Setup (Optional)

### 14. PostHog Analytics (Optional)

**Optional:** Enable product analytics and session replay

**Setup:**
1. [ ] Sign up at https://posthog.com
2. [ ] Get project API key
3. [ ] Add to environment variables:

```bash
# .env.local
VITE_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Production:**
- [ ] Add same variables to production environment
- [ ] Verify analytics events are being captured
- [ ] Set up dashboards for key metrics

**Note:** Analytics are opt-in and privacy-focused. Can be skipped if not needed.

---

## 📚 Resources

### Documentation
- Email Setup Guide: `convex/email/SETUP.md`
- Email System Overview: `convex/email/README.md`
- Environment Variables: `.env.example`

### External Links
- Resend Dashboard: https://resend.com/dashboard
- SendPulse Dashboard: https://login.sendpulse.com/
- Convex Dashboard: https://dashboard.convex.dev/d/peaceful-salmon-964
- React Email: https://react.email/docs

### Support
- Resend Docs: https://resend.com/docs
- SendPulse API: https://sendpulse.com/api
- Convex Docs: https://docs.convex.dev/

---

## 🚨 Critical Reminders

1. **Never commit API keys to git** - Always use environment variables
2. **Set APP_URL in production** - Emails will link to localhost otherwise
3. **Test unsubscribe before launch** - Required by law (CAN-SPAM, GDPR)
4. **Verify domain for production** - Improves deliverability, reduces spam
5. **Monitor email volume** - Don't exceed free tier limits unexpectedly

---

## 📝 Quick Summary: What's Implemented vs What Needs Setup

| Feature | Code Status | OAuth/Setup Required | Manual Steps |
|---------|-------------|----------------------|--------------|
| Email Notifications | ✅ Complete | 🔴 Yes | Email provider account + API keys |
| REST API / API Keys | ✅ Complete | ✅ No | None - generate keys in Settings |
| Pumble Integration | ✅ Complete | 🟡 Webhook URL | Get webhook URL from Pumble |
| Google Calendar | ✅ Complete | 🔴 Yes | Google Cloud project + OAuth |
| GitHub Integration | ✅ Complete | 🔴 Yes | GitHub OAuth app + credentials |
| Offline Mode / PWA | ✅ Complete | ✅ No | None - works out of the box! |
| Responsive Design | ✅ Complete | ✅ No | None - already applied |
| Dark Mode | ✅ Complete | ✅ No | None - already implemented |
| Onboarding Flow | ✅ Complete | ✅ No | None - auto-triggers for new users |

**Priority Order for Production:**
1. **Email Notifications** - Users expect this
2. **REST API** - Already works, just generate keys
3. **Pumble Integration** - Simple webhook setup
4. **Offline Mode** - Already works, just deploy
5. **Google Calendar** - If calendar sync is important
6. **GitHub Integration** - If targeting developers

---

**Last Updated:** 2025-11-18
**Status:** Phase 1 Complete - OAuth Setup Optional for Integrations
