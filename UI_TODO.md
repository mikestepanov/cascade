# UI Architectural Review & TODOs

This document outlines critical user interface and frontend architecture gaps found during a comprehensive review, with a focus on performance, scalability, and "Power User" experience.

## 🚨 Critical Priority (Performance & Scalability)

### 1. Mobile Kanban Experience

**Current State**: `KanbanBoard.tsx` relies on `overflow-x-auto` and standard desktop drag events.
**Risk**: "Drag and Drop" is notoriously difficult on mobile touch screens. Users may accidentally scroll the page instead of moving cards.
**Recommended Action**:

- **Touch-Friendly DND**: Ensure the DND library supports touch sensors and auto-scrolling on mobile.
- **List View Fallback**: Automatically switch to a vertically stacked "List View" on mobile breakpoints (< 640px) for better usability.

---

## 🛠 Medium Priority (UX & Polish)

### 2. Optimistic UI Updates

**Current State**: Most mutations wait for the server response before updating the UI (standard behavior).
**Risk**: The app feels "sluggish" compared to competitors like Linear/Jira.
**Recommended Action**:

- Implement **Convex Optimistic Updates**.
- When dragging a card, it should snap instantly. When resolving an issue, it should disappear immediately.
- **Action Item**: Add `optimisticUpdate` handlers to key mutations in `issues.ts` and use them in `useMutation` hooks.

### 3. Customizable Dashboard Layout

**Current State**: The dashboard layout is hardcoded in a grid.
**Recommendation**:

- Allow users to toggle widgets on/off (e.g., "Hide Recent Activity").
- Store user preferences in `userSettings` table (Convex).

### 4. "Power User" Keyboard Navigation

**Current State**: Basic keyboard support exists via `useListNavigation`.
**Recommendation**:

- Expand coverage: Ensure typical "J/K" navigation works on **all** lists (Roadmap, Kanban columns).
- Add a global "Command Palette" (`Cmd+K`) for jumping to projects or creating issues from anywhere (component exists, ensure it's globally mounted).

---

## 🔍 Visual & Aesthetics

### 5. Consistency Check

- **Loading States**: `KanbanBoard` has nice Skeletons. Ensure `RoadmapView` and `Dashboard` have matching fidelity skeletons.
- **Colors**: Verify that status colors (Todo/In Progress/Done) are consistent across all views (Kanban vs Roadmap vs Activity Feed).

---

## ✅ Completed Tasks

### Virtualized Roadmap View (Completed)

- Implemented `react-window` in `RoadmapView.tsx`
- Virtualized list rendering for timeline to support 500+ issues seamlessly
- Optimized scroll performance

### Scalable Dashboard "My Work" (Completed)

- Added `paginationOpts` to `getMyIssues` query in `dashboard.ts`
- Refactored `Dashboard.tsx` to use `usePaginatedQuery`
- Added "Load More" button to `MyIssuesList` component
