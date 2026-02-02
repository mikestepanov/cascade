# E2E Test Suite & Editor Migration TODO

> **Last Updated:** 2026-02-02

---

## Current Status

| Metric | Value |
|--------|-------|
| E2E Tests | 110+ (Sprint 1-3 complete) |
| Route Coverage | ~80% |
| Editor | BlockNote (migrating to Plate) |

---

## Sprint 4: Editor Migration & Advanced Features

### P0 - Migrate BlockNote → Plate

**Why:** Plate is more robust, has AI plugins, React 19 compatible, shadcn/ui native, MIT licensed.

| Task | Est. Time | Status |
|------|-----------|--------|
| Install Plate packages (`@udecode/plate-*`) | 30min | [ ] |
| Create new `PlateEditor` component | 2-3h | [ ] |
| Configure plugins (paragraph, heading, list, code, image, table) | 1-2h | [ ] |
| Add slash menu plugin | 30min | [ ] |
| Add floating toolbar plugin | 30min | [ ] |
| Add drag-drop blocks plugin | 30min | [ ] |
| Rewrite `markdown.ts` for Slate format | 1-2h | [ ] |
| Implement slate-yjs for collaboration | 2-3h | [ ] |
| Create Convex Y.js provider | 2-3h | [ ] |
| Migrate existing documents (format conversion) | 1h | [ ] |
| Remove BlockNote packages | 15min | [ ] |
| Test all document flows | 1h | [ ] |
| **Total** | **~12-15h** | |

### P1 - Real-Time Collaboration

| Task | Status |
|------|--------|
| Create Convex Y.js provider (sync via subscriptions) | [ ] |
| Store Y.js document state as binary in Convex | [ ] |
| Add cursor/presence sync (leverage existing Convex Presence) | [ ] |
| Test concurrent editing scenarios | [ ] |

### P2 - Additional E2E Coverage

| Task | Status |
|------|--------|
| Add OAuth flow tests | [ ] |
| Add multi-browser testing (Firefox, WebKit) | [ ] |
| Add performance baselines | [ ] |
| Test document collaboration E2E | [ ] |

---

## Remaining E2E Gaps (Lower Priority)

### Routes Still Needing Tests

| Route | Feature | Priority |
|-------|---------|----------|
| `/projects/$key/activity` | Activity feed | P2 |
| `/workspaces/$slug/teams/$teamSlug/calendar` | Team calendar | P2 |
| `/workspaces/$slug/teams/$teamSlug/settings` | Team settings | P3 |
| `/time-tracking` | Org time tracking | P3 |

### Infrastructure Improvements

| Task | Priority |
|------|----------|
| Remove remaining hardcoded timeouts (~11 instances) | P3 |
| Add visual regression testing (Percy) | P3 |
| Add mobile viewport tests | P3 |

---

## Completed (Archive)

<details>
<summary>Sprint 1-3 Completed Tasks</summary>

### Sprint 1: Stability ✅
- Removed hardcoded timeouts from high-traffic files
- Fixed silent failure patterns in calendar, rbac, auth specs
- Fixed flaky Issue Detail tests
- Completed billing test TODOs
- Deleted debug spec files

### Sprint 2: Core Coverage ✅
- Added `teams.spec.ts` - team board tests
- Added `roadmap.spec.ts` - roadmap view tests
- Added `invite.spec.ts` - invite acceptance flow
- Added `issue-detail-page.spec.ts` - issue detail tests

### Sprint 3: Depth ✅
- Added `search.spec.ts` - 7 deep search tests
- Added `analytics.spec.ts` - 5 analytics dashboard tests
- Added `board-drag-drop.spec.ts` - 5 drag-drop tests
- Added `permission-cascade.spec.ts` - 9 permission tests

</details>

---

## Related Documentation

- [Plate.js Docs](https://platejs.org/)
- [slate-yjs](https://github.com/BitPhinix/slate-yjs)
- [Testing Guide](./docs/testing/README.md)
- [Playwright Config](./playwright.config.ts)
