# Feature Gaps (P1-P2)

> **Priority:** P2 (Nice-to-have for MVP)
> **Effort:** Medium
> **Status:** Partially complete

---

## Completed

- [x] **Label groups** - Organize labels into groups (Priority, Component, Area)
- [x] **Velocity charts** - Track story points per sprint
- [x] **Saved Filters UI** - Backend exists, UI integrated

---

## Tasks

### 1. Rich Text Comments

**What:** Improve Markdown support in issue comments to match the document editor quality.

**Current state:** Comments support basic Markdown but lack:
- Live preview
- @ mentions with autocomplete
- Emoji picker
- File attachments inline

**Implementation:**

```tsx
// Option 1: Use same Plate editor as documents (heavyweight)
// Option 2: Simple Markdown textarea with preview toggle (lightweight)

// Recommendation: Option 2 for comments, keep them lightweight
```

**Files to update:**
- [ ] `src/components/CommentEditor.tsx` - Add preview toggle
- [ ] `src/components/CommentRenderer.tsx` - Improve Markdown rendering
- [ ] Add @ mention autocomplete (query users)

---

### 2. User Picker Custom Field

**What:** A custom field type that lets you pick a user (for "Reviewer", "QA", "Designer" fields).

**Current custom field types:** `text`, `number`, `date`, `select`, `multiselect`, `url`

**New type needed:** `user`

**Implementation:**

```typescript
// convex/schema.ts
customFields: defineTable({
  // ...existing fields
  type: v.union(
    v.literal("text"),
    v.literal("number"),
    v.literal("date"),
    v.literal("select"),
    v.literal("multiselect"),
    v.literal("url"),
    v.literal("user"),  // ← Add this
  ),
})

// convex/customFields.ts - Update validation
// For "user" type, value should be a user ID

// src/components/CustomFieldValues.tsx
// Add user picker component using existing FuzzySearchInput
```

**Files to update:**
- [ ] `convex/schema.ts` - Add `user` type
- [ ] `convex/customFields.ts` - Add validation for user type
- [ ] `src/components/CustomFieldValues.tsx` - Add user picker UI
- [ ] `src/components/CustomFieldsManager.tsx` - Allow creating user fields

---

### 3. Slack Integration

**What:** Extend existing webhook infrastructure to support Slack.

**Current state:** We have `pumbleWebhooks` for Pumble (Slack clone). Need to adapt for Slack.

**Slack-specific requirements:**
- OAuth app installation flow
- Different API format (`chat.postMessage` vs Pumble's format)
- Slash commands (`/nixelo create "Bug title"`)
- Link unfurling (paste issue URL → shows preview)

**Implementation phases:**

#### Phase 1: Outbound notifications
- [ ] Create Slack OAuth app in Slack API dashboard
- [ ] Implement OAuth callback handler
- [ ] Adapt `pumbleWebhooks.ts` to support Slack format
- [ ] Add Slack workspace connection UI in settings

#### Phase 2: Slash commands
- [ ] Register `/nixelo` command with Slack
- [ ] Create `convex/http.ts` handler for slash commands
- [ ] Support `create`, `search`, `assign` subcommands

#### Phase 3: Link unfurling
- [ ] Register URL patterns with Slack
- [ ] Create unfurl handler that returns issue details
- [ ] Cache unfurl responses

**Files to create/update:**
- [ ] `convex/slack.ts` - Slack-specific functions
- [ ] `convex/http.ts` - Add Slack webhook handlers
- [ ] `src/routes/$orgSlug/settings/integrations/slack.tsx` - Connection UI
- [ ] `src/components/Settings/SlackIntegration.tsx` - Component

---

## Acceptance Criteria

- [ ] Comments have Markdown preview and @ mentions
- [ ] "User" custom field type works with user picker
- [ ] Slack notifications work for issue events
- [ ] (Optional) Slack slash commands create issues
- [ ] All features have unit tests

---

## Related Files

- `convex/pumbleWebhooks.ts` - Reference for webhook patterns
- `src/components/CustomFieldValues.tsx` - Custom field rendering
- `src/components/fuzzy-search/FuzzySearchInput.tsx` - User picker base
