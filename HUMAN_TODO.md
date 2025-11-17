# Human TODO - Manual Setup & Configuration

This document contains tasks that require **manual human intervention** - things that can't be automated through code. These are configuration, setup, and deployment tasks.

---

## 🚀 Quick Start Checklist

**Minimum Required to Run Cascade:**
1. [ ] Install dependencies: `pnpm install`
2. [ ] Start Convex dev: `pnpm run dev:backend`
3. [ ] Start frontend: `pnpm run dev:frontend`
4. [ ] (Optional) Configure email provider for notifications
5. [ ] (Optional) Install testing dependencies for backend tests

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

**Last Updated:** 2025-01-17
**Status:** Email Notifications 100% Complete - Awaiting Manual Setup
