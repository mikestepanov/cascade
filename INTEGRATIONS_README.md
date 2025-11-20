# Cascade Integrations & Offline Mode

This document describes the new integration features added to Cascade, including GitHub integration, Google Calendar sync, and offline mode with PWA support.

## 🚀 Features Added

### 1. GitHub Integration

Connect your GitHub account and link repositories to projects for seamless development workflow integration.

**Features:**
- OAuth authentication with GitHub
- Link GitHub repositories to Cascade projects
- Automatic PR (Pull Request) tracking
- Commit tracking with auto-linking to issues
- PR status display on issues (open, merged, closed)
- Webhook support for real-time updates from GitHub

**Database Schema:**
- `githubConnections` - Store user GitHub OAuth tokens
- `githubRepositories` - Link projects to GitHub repos
- `githubPullRequests` - Track PRs linked to issues
- `githubCommits` - Track commits mentioning issues

**Backend Functions:** (`convex/github.ts`)
- `connectGitHub` - Connect GitHub account
- `disconnectGitHub` - Disconnect GitHub
- `linkRepository` - Link a repo to a project
- `unlinkRepository` - Unlink a repo
- `listRepositories` - List linked repos
- `getPullRequests` - Get PRs for an issue
- `getCommits` - Get commits for an issue
- `upsertPullRequest` - Create/update PR (from webhook)
- `upsertCommit` - Create/update commit
- `linkPRToIssue` - Manually link PR to issue

**Webhook Endpoint:**
- `/github/webhook` - Receives GitHub webhook events
- Handles: `pull_request`, `push`, `pull_request_review` events

**How it works:**
1. User connects GitHub account via OAuth
2. Admin links a GitHub repository to a Cascade project
3. PRs and commits are synced via webhook
4. Issue keys in commit messages (e.g., "fixes PROJ-123") auto-link to issues
5. PR status shows on issue detail page

---

### 2. Google Calendar Integration

Sync your Cascade calendar events with Google Calendar for unified scheduling.

**Features:**
- OAuth authentication with Google
- Bi-directional calendar sync (import/export/both)
- Auto-sync Cascade events to Google Calendar
- Import Google Calendar events to Cascade
- Configurable sync direction and schedule

**Database Schema:**
- `calendarConnections` - Store OAuth tokens and sync settings (already existed, now implemented)

**Backend Functions:** (`convex/googleCalendar.ts`)
- `connectGoogle` - Connect Google Calendar
- `disconnectGoogle` - Disconnect Google
- `getConnection` - Get current connection
- `updateSyncSettings` - Update sync preferences
- `refreshToken` - Refresh expired OAuth token
- `markSynced` - Mark last sync time
- `listConnections` - List all calendar connections
- `syncFromGoogle` - Import events from Google (scheduled)
- `getEventsToSync` - Get events to export to Google

**Sync Directions:**
- **Import** - Only import from Google → Cascade
- **Export** - Only export from Cascade → Google
- **Bidirectional** - Two-way sync (default)

**How it works:**
1. User connects Google Calendar via OAuth
2. Choose sync direction (import/export/bidirectional)
3. Background sync runs periodically
4. Events are synced based on last sync timestamp
5. User can trigger manual sync

---

### 3. Offline Mode & PWA Support

Full Progressive Web App (PWA) support with offline functionality and background sync.

**Features:**
- Service Worker for offline caching
- IndexedDB for local data storage
- Offline mutation queue (pending sync)
- Auto-sync when connection restored
- Network status indicator
- Installable as native app
- Offline fallback page

**Dependencies Installed:**
- `vite-plugin-pwa` - PWA plugin for Vite
- `workbox-*` - Google Workbox for service worker utilities

**Key Files:**
- `src/service-worker.ts` - Service Worker implementation
- `src/lib/offline.ts` - Offline utilities and IndexedDB wrapper
- `src/hooks/useOffline.ts` - React hooks for offline status
- `public/offline.html` - Offline fallback page
- `vite.config.ts` - PWA configuration

**Database Schema:**
- `offlineSyncQueue` - Queue for pending mutations

**Backend Functions:** (`convex/offlineSync.ts`)
- `queueMutation` - Add mutation to queue
- `getPendingMutations` - Get pending sync items
- `markSyncing` - Mark as in progress
- `markCompleted` - Mark as synced
- `markFailed` - Mark as failed (with retry)
- `getSyncStatus` - Get queue status
- `clearCompleted` - Clean up old items
- `retryFailed` - Retry failed mutations
- `listQueue` - Debug: list all queue items

**React Hooks:**
```typescript
// Track online/offline status
const isOnline = useOnlineStatus();

// Get sync queue status
const { pending, count, isLoading } = useOfflineSyncStatus();

// Manage offline queue
const { queue, refresh, retryMutation, deleteMutation, clearSynced } = useOfflineQueue();
```

**How it works:**
1. Service Worker caches app assets and API responses
2. When offline, mutations are queued in IndexedDB
3. When online, queued mutations are synced automatically
4. Background sync API triggers sync when connection restored
5. User sees sync status and can retry failed items

---

## 🛠️ Setup Instructions

### GitHub Integration Setup

1. **Create GitHub OAuth App:**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create new app with callback URL: `https://yourdomain.com/auth/github/callback`
   - Copy Client ID and Client Secret

2. **Configure Auth Provider:**
   - Update `convex/auth.config.ts` with GitHub provider
   - Add environment variables:
     ```
     GITHUB_CLIENT_ID=your_client_id
     GITHUB_CLIENT_SECRET=your_client_secret
     ```

3. **Set up GitHub Webhook:**
   - In your GitHub repo, go to Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/github/webhook`
   - Select events: Pull requests, Pushes, Pull request reviews
   - Copy webhook secret

4. **Link Repository:**
   - User connects GitHub account in Cascade settings
   - Project admin links GitHub repository to project
   - Webhook events will now sync automatically

---

### Google Calendar Integration Setup

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project
   - Enable Google Calendar API

2. **Create OAuth Credentials:**
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://yourdomain.com/auth/google/callback`
   - Copy Client ID and Client Secret

3. **Configure Auth Provider:**
   - Update `convex/auth.config.ts` with Google provider
   - Add environment variables:
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```

4. **Connect Calendar:**
   - User goes to Settings → Integrations
   - Click "Connect Google Calendar"
   - Authorize Cascade to access calendar
   - Choose sync direction
   - Sync starts automatically

---

### Offline Mode Setup

**No setup required!** PWA is enabled automatically.

**To test offline mode:**
1. Start dev server: `pnpm run dev`
2. Open app in browser
3. Open DevTools → Application → Service Workers
4. Check "Offline" checkbox
5. App will continue working with cached data
6. Make changes offline (queued in IndexedDB)
7. Uncheck "Offline" - changes sync automatically

**To install as app:**
1. Open app in Chrome/Edge
2. Click install icon in address bar
3. App installs as standalone application
4. Works offline with full functionality

---

## 📱 PWA Manifest

The app is configured as a Progressive Web App with:
- **Name:** Cascade - Project Management
- **Short Name:** Cascade
- **Theme Color:** #3b82f6 (blue)
- **Display:** Standalone (full-screen app)
- **Icons:** 192x192 and 512x512 PNG icons

**PWA Features:**
- Install to home screen/desktop
- Full-screen app experience
- Offline functionality
- Background sync
- Push notifications (ready for future)

---

## 🔒 Security Considerations

### OAuth Tokens
- **Storage:** OAuth tokens stored in Convex database
- **Encryption:** In production, encrypt tokens at rest
- **Expiration:** Tokens auto-refresh when expired
- **Revocation:** Users can disconnect accounts anytime

### GitHub Webhook Security
- **Signature Verification:** Verify `X-Hub-Signature-256` header
- **Secret:** Use webhook secret to validate requests
- **HTTPS:** Always use HTTPS for webhook endpoints

### Offline Queue
- **User Isolation:** Queue items tied to user ID
- **Validation:** All mutations validated server-side
- **Retry Logic:** Failed items retry max 3 times
- **Cleanup:** Auto-delete synced items after 24 hours

---

## 🧪 Testing

### Test GitHub Integration:
```bash
# 1. Connect GitHub account
# 2. Link a test repository
# 3. Create a PR with issue key in title
# 4. Check if PR shows on issue page
```

### Test Google Calendar:
```bash
# 1. Connect Google Calendar
# 2. Create event in Cascade
# 3. Check if event appears in Google Calendar
# 4. Create event in Google Calendar
# 5. Check if event appears in Cascade
```

### Test Offline Mode:
```bash
# 1. Load app while online
# 2. Toggle DevTools offline mode
# 3. Navigate app (uses cache)
# 4. Create/update issue (queued)
# 5. Toggle online mode
# 6. Check if changes synced
```

---

## 📊 Monitoring

### GitHub Integration:
- Check `githubRepositories` table for linked repos
- Check `githubPullRequests` for PR sync status
- Check `githubCommits` for commit auto-linking
- Monitor webhook execution logs

### Google Calendar:
- Check `calendarConnections` for active connections
- Check `lastSyncAt` timestamp for sync health
- Monitor sync job logs
- Check event count before/after sync

### Offline Queue:
- Query `offlineSyncQueue` table
- Check `status` distribution (pending/syncing/completed/failed)
- Monitor `attempts` for stuck items
- Check `error` field for failure patterns

---

## 🐛 Troubleshooting

### GitHub PR not showing up:
1. Check if repo is linked to project
2. Verify webhook is configured correctly
3. Check PR title/body for issue key (e.g., "PROJ-123")
4. Check webhook delivery logs in GitHub
5. Check `githubPullRequests` table

### Google Calendar sync not working:
1. Check if token expired (refresh token should auto-renew)
2. Verify sync is enabled (`syncEnabled: true`)
3. Check `lastSyncAt` timestamp
4. Check sync job logs
5. Verify Google Calendar API permissions

### Offline sync stuck:
1. Check queue status: `getSyncStatus()`
2. Check failed items: filter by `status: "failed"`
3. Retry failed items: `retryFailed()`
4. Clear old items: `clearCompleted()`
5. Check browser console for errors
6. Verify service worker is active

---

## 🚧 TODO / Future Improvements

### GitHub Integration:
- [ ] Add GitHub Issues sync (optional)
- [ ] Display CI/CD status on issues
- [ ] Show deployment status
- [ ] Link multiple repos to one project
- [ ] GitHub comments ↔ Cascade comments sync
- [ ] Branch protection status
- [ ] Code review integration

### Google Calendar:
- [ ] Conflict resolution (edit same event both places)
- [ ] Calendar color mapping
- [ ] Attendee sync (Google → Cascade users)
- [ ] Recurring event support
- [ ] Reminder sync
- [ ] Multiple calendar support
- [ ] Outlook Calendar integration

### Offline Mode:
- [ ] Optimistic UI updates
- [ ] Conflict resolution UI
- [ ] Download all project data for full offline
- [ ] Offline search
- [ ] Offline attachments
- [ ] Background sync improvements
- [ ] Push notifications

---

## 📚 API Reference

See individual function files for detailed API:
- `convex/github.ts` - GitHub integration functions
- `convex/googleCalendar.ts` - Google Calendar functions
- `convex/offlineSync.ts` - Offline sync functions
- `src/lib/offline.ts` - Frontend offline utilities
- `src/hooks/useOffline.ts` - React hooks

---

## 📝 Notes

- GitHub and Google integrations require OAuth apps set up
- Offline mode works out of the box (no OAuth needed)
- Service Worker only works on HTTPS (or localhost)
- PWA can be installed on mobile and desktop
- All features work with existing RBAC (role-based access control)

---

**Last Updated:** 2025-11-20
**Version:** 1.0.0
**Status:** Initial Implementation - Ready for Testing
