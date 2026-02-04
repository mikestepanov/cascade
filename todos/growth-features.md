# Growth Features

> **Priority:** P4 (Post-Launch)
> **Effort:** Medium-Large
> **Status:** Not started

---

## Tasks

### Calendar & Slack Sync

- [ ] **Outlook Calendar integration** - Sync events with Microsoft 365
- [ ] **Post issue updates to Slack** - Webhook notifications
- [ ] **Create issues from Slack** - `/nixelo create "Bug title"` command
- [ ] **Unfurl issue links** - Paste URL → shows preview card

### Enhanced Search

- [ ] **Fuzzy matching** - Tolerate typos in search
- [ ] **Search shortcuts** - `type:bug`, `@me`, `status:done`
- [ ] **Advanced search modal** - Visual query builder

### Documents

- [ ] **Version history** - Track document changes over time
- [ ] **Diff view** - Compare versions side-by-side

### Board Enhancements (P3)

- [ ] **Label descriptions** - Show description on hover
- [ ] **Query language** - Simple `status:done priority:high` syntax
- [ ] **Swimlanes** - Group board rows by assignee/epic
- [ ] **WIP limits** - Warn when column exceeds limit
- [ ] **Auto-cycles** - Auto-create next sprint like Linear

---

## Related Files

- `convex/documents.ts` - Document queries
- `src/components/GlobalSearch.tsx` - Search UI
