# Plate Editor Migration - Full Implementation Plan

> **Last Updated:** 2026-02-02

---

## Current Status

| Metric | Value |
|--------|-------|
| E2E Tests | 110+ (Sprint 1-3 complete) |
| Route Coverage | ~80% |
| Editor | BlockNote → **migrating to Plate** |

---

## Why Plate?

- **React 19 compatible** (BlockNote has StrictMode issues)
- **AI plugins** (copilot, AI commands built-in)
- **shadcn/ui native** (matches our component library)
- **MIT licensed** (BlockNote is MPL-2.0 + paid add-ons)
- **slate-yjs** for real-time collaboration
- **12k GitHub stars**, active maintenance

---

## Phase 1: Core Editor (Frontend)

### 1.1 Package Setup

| Task | Files | Status |
|------|-------|--------|
| Install Plate packages | `package.json` | [ ] |
| - `@udecode/plate` (core) | | |
| - `@udecode/plate-basic-marks` (bold, italic, etc.) | | |
| - `@udecode/plate-heading` | | |
| - `@udecode/plate-list` | | |
| - `@udecode/plate-code-block` | | |
| - `@udecode/plate-table` | | |
| - `@udecode/plate-media` (images) | | |
| - `@udecode/plate-dnd` (drag-drop) | | |
| - `@udecode/plate-slash-command` | | |
| - `@udecode/plate-floating` (toolbar) | | |
| Configure Plate in project | `src/lib/plate/` | [ ] |

### 1.2 Editor Component

| Task | Files | Status |
|------|-------|--------|
| Create `PlateEditor.tsx` component | `src/components/PlateEditor.tsx` | [ ] |
| Create plugin configuration | `src/lib/plate/plugins.ts` | [ ] |
| Create editor instance factory | `src/lib/plate/editor.ts` | [ ] |
| Style editor with shadcn/ui tokens | `src/lib/plate/styles.ts` | [ ] |
| Add slash command menu | `src/components/plate/SlashMenu.tsx` | [ ] |
| Add floating toolbar | `src/components/plate/FloatingToolbar.tsx` | [ ] |
| Add drag-drop block handles | `src/components/plate/DragHandle.tsx` | [ ] |

### 1.3 Markdown Utilities (Rewrite)

| Task | Files | Status |
|------|-------|--------|
| Rewrite `markdown.ts` for Slate format | `src/lib/markdown.ts` | [ ] |
| - `exportToMarkdown()` → Slate nodes to MD | | |
| - `importFromMarkdown()` → MD to Slate nodes | | |
| - Handle all block types (heading, list, code, table, image) | | |
| Add markdown serializer tests | `src/lib/markdown.test.ts` | [ ] |

---

## Phase 2: Backend (Convex)

### 2.1 Y.js Collaboration Backend

| Task | Files | Status |
|------|-------|--------|
| Create Y.js document table | `convex/schema.ts` | [ ] |
| - `yjsDocuments` table (binary state storage) | | |
| - Fields: `documentId`, `state` (bytes), `updatedAt` | | |
| Create Y.js sync mutations | `convex/yjs.ts` | [ ] |
| - `getDocumentState(documentId)` query | | |
| - `updateDocumentState(documentId, update)` mutation | | |
| - `subscribeToUpdates(documentId)` subscription | | |
| Add auth checks to Y.js functions | `convex/yjs.ts` | [ ] |
| - Reuse document permission checks from `prosemirror.ts` | | |

### 2.2 Migration Support

| Task | Files | Status |
|------|-------|--------|
| Create format conversion utility | `convex/migrations/blockNoteToPlate.ts` | [ ] |
| - Convert ProseMirror snapshots to Slate format | | |
| - Handle all block types | | |
| Create migration mutation | `convex/migrations/migrateDocuments.ts` | [ ] |
| - Batch convert existing documents | | |
| - Track migration progress | | |
| Add rollback capability | `convex/migrations/migrateDocuments.ts` | [ ] |

### 2.3 Cleanup Old System

| Task | Files | Status |
|------|-------|--------|
| Remove `@convex-dev/prosemirror-sync` usage | `convex/prosemirror.ts` | [ ] |
| Update version history for new format | `convex/documentVersions.ts` | [ ] |
| Update document search (if content indexed) | `convex/documents.ts` | [ ] |

---

## Phase 3: Real-Time Collaboration

### 3.1 Convex Y.js Provider

| Task | Files | Status |
|------|-------|--------|
| Create `ConvexYjsProvider` class | `src/lib/yjs/ConvexYjsProvider.ts` | [ ] |
| - Extend Y.js `AbstractProvider` | | |
| - Connect to Convex subscription | | |
| - Handle `update` events bidirectionally | | |
| - Reconnection logic | | |
| Integrate with Plate editor | `src/components/PlateEditor.tsx` | [ ] |
| Add awareness (cursor sync) | `src/lib/yjs/awareness.ts` | [ ] |
| - Leverage existing Convex Presence system | | |
| - Show collaborator cursors in editor | | |

### 3.2 Presence Integration

| Task | Files | Status |
|------|-------|--------|
| Connect Y.js awareness to Convex Presence | `src/lib/yjs/presence.ts` | [ ] |
| Add cursor colors per user | `src/lib/yjs/cursorColors.ts` | [ ] |
| Add collaborator avatars in margin | `src/components/plate/Collaborators.tsx` | [ ] |

---

## Phase 4: Unit Tests (Vitest)

### 4.1 Frontend Unit Tests

| Task | Files | Status |
|------|-------|--------|
| Test Plate plugin configuration | `src/lib/plate/plugins.test.ts` | [ ] |
| Test markdown import/export | `src/lib/markdown.test.ts` | [ ] |
| - Heading conversions | | |
| - List conversions (bullet, numbered, checklist) | | |
| - Code block conversions | | |
| - Table conversions | | |
| - Image conversions | | |
| - Round-trip integrity | | |
| Test ConvexYjsProvider | `src/lib/yjs/ConvexYjsProvider.test.ts` | [ ] |
| - Connection lifecycle | | |
| - Update propagation | | |
| - Error handling | | |
| Test editor instance creation | `src/lib/plate/editor.test.ts` | [ ] |

### 4.2 Backend Unit Tests (Convex)

| Task | Files | Status |
|------|-------|--------|
| Test Y.js document state queries | `convex/yjs.test.ts` | [ ] |
| - Permission checks | | |
| - State serialization | | |
| Test migration utilities | `convex/migrations/blockNoteToPlate.test.ts` | [ ] |
| - Block type conversions | | |
| - Edge cases (empty docs, nested blocks) | | |
| Test document version handling | `convex/documentVersions.test.ts` | [ ] |

---

## Phase 5: E2E Tests (Playwright)

### 5.1 Update Existing Document Tests

| Task | Files | Status |
|------|-------|--------|
| Update `documents.spec.ts` for Plate | `e2e/documents.spec.ts` | [ ] |
| Update `documents.page.ts` selectors | `e2e/pages/documents.page.ts` | [ ] |
| - New editor container selectors | | |
| - Slash menu selectors | | |
| - Floating toolbar selectors | | |

### 5.2 New Editor E2E Tests

| Task | Files | Status |
|------|-------|--------|
| Create `editor-plate.spec.ts` | `e2e/editor-plate.spec.ts` | [ ] |
| **Basic editing tests:** | | |
| - Type text in editor | | |
| - Create headings (H1, H2, H3) | | |
| - Create bullet list | | |
| - Create numbered list | | |
| - Create checklist | | |
| - Create code block | | |
| - Bold/italic/underline formatting | | |
| **Slash commands tests:** | | |
| - Open slash menu with `/` | | |
| - Insert heading via slash | | |
| - Insert list via slash | | |
| - Insert code block via slash | | |
| - Insert image via slash | | |
| **Drag-drop tests:** | | |
| - Drag block to reorder | | |
| - Drag handle visibility | | |
| **Toolbar tests:** | | |
| - Select text shows floating toolbar | | |
| - Apply bold from toolbar | | |
| - Apply link from toolbar | | |

### 5.3 Collaboration E2E Tests

| Task | Files | Status |
|------|-------|--------|
| Create `collaboration.spec.ts` | `e2e/collaboration.spec.ts` | [ ] |
| **Multi-user tests (2 browser contexts):** | | |
| - User A types, User B sees update | | |
| - Concurrent typing (conflict resolution) | | |
| - User cursors visible to each other | | |
| - User joins/leaves document | | |
| **Offline/reconnect tests:** | | |
| - Edit while offline, sync on reconnect | | |
| - Handle network interruption | | |

### 5.4 Migration E2E Tests

| Task | Files | Status |
|------|-------|--------|
| Create `migration.spec.ts` | `e2e/migration.spec.ts` | [ ] |
| - Open pre-migration document | | |
| - Verify content preserved | | |
| - Edit migrated document | | |
| - Version history still works | | |

---

## Phase 6: Cleanup & Polish

### 6.1 Remove BlockNote

| Task | Files | Status |
|------|-------|--------|
| Remove BlockNote packages from `package.json` | `package.json` | [ ] |
| - `@blocknote/core` | | |
| - `@blocknote/mantine` | | |
| - `@convex-dev/prosemirror-sync` | | |
| Delete `DocumentEditor.tsx` (old) | `src/components/DocumentEditor.tsx` | [ ] |
| Delete BlockNote CSS imports | `src/components/DocumentEditor.tsx` | [ ] |
| Update any remaining imports | various | [ ] |

### 6.2 Documentation

| Task | Files | Status |
|------|-------|--------|
| Update `docs/` with Plate architecture | `docs/editor/README.md` | [ ] |
| Add collaboration guide | `docs/editor/collaboration.md` | [ ] |
| Update CLAUDE.md if needed | `CLAUDE.md` | [ ] |

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
| Add OAuth flow tests | P2 |
| Add multi-browser testing (Firefox, WebKit) | P2 |

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
- [Y.js Docs](https://docs.yjs.dev/)
- [Testing Guide](./docs/testing/README.md)
- [Playwright Config](./playwright.config.ts)
