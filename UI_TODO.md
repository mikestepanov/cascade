# UI Architectural Review & TODOs

This document outlines critical user interface and frontend architecture gaps found during a comprehensive review, with a focus on performance, scalability, and "Power User" experience.

## 🚨 Critical Priority (Performance & Scalability)

### 1. Virtualized Roadmap View

**Current State**: `RoadmapView.tsx` renders a standard vertical list of all issues with complex date calculations for timeline bars.
**Risk**: rendering 500+ issues will cause significant main-thread blocking and UI lag. Browsers struggle with extensive DOM nodes and layout recalculations.
**Recommended Action**:

- Implement **Virtualization** using `react-window` or `@tanstack/react-virtual`.
- Fetch data in pages (cursor-based) rather than all-at-once.
- **Action Item**: Refactor `RoadmapView` to use a virtual list container.

### 2. Scalable Dashboard "My Work"

**Current State**: `Dashboard.tsx` fetches all assigned issues (`getMyIssues`) without limit.
**Risk**: Users with years of ticket history will experience slow initial page loads.
**Recommended Action**:

- Add **Pagination** to the "My Issues" widget.
- Default to fetching only the last 20-50 items.
- Add a "Load More" button or infinite scroll trigger at the bottom of the list.

### 3. Mobile Kanban Experience

**Current State**: `KanbanBoard.tsx` relies on `overflow-x-auto` and standard desktop drag events.
**Risk**: "Drag and Drop" is notoriously difficult on mobile touch screens. Users may accidentally scroll the page instead of moving cards.
**Recommended Action**:

- **Touch-Friendly DND**: Ensure the DND library supports touch sensors and auto-scrolling on mobile.
- **List View Fallback**: Automatically switch to a vertically stacked "List View" on mobile breakpoints (< 640px) for better usability.

---

## 🛠 Medium Priority (UX & Polish)

### 4. Optimistic UI Updates

**Current State**: Most mutations wait for the server response before updating the UI (standard behavior).
**Risk**: The app feels "sluggish" compared to competitors like Linear/Jira.
**Recommended Action**:

- Implement **Convex Optimistic Updates**.
- When dragging a card, it should snap instantly. When resolving an issue, it should disappear immediately.
- **Action Item**: Add `optimisticUpdate` handlers to key mutations in `issues.ts` and use them in `useMutation` hooks.

### 5. Customizable Dashboard Layout

**Current State**: The dashboard layout is hardcoded in a grid.
**Recommendation**:

- Allow users to toggle widgets on/off (e.g., "Hide Recent Activity").
- Store user preferences in `userSettings` table (Convex).

### 6. "Power User" Keyboard Navigation

**Current State**: Basic keyboard support exists via `useListNavigation`.
**Recommendation**:

- Expand coverage: Ensure typical "J/K" navigation works on **all** lists (Roadmap, Kanban columns).
- Add a global "Command Palette" (`Cmd+K`) for jumping to projects or creating issues from anywhere (component exists, ensure it's globally mounted).

---

## 🔍 Visual & Aesthetics

### 7. Consistency Check

- **Loading States**: `KanbanBoard` has nice Skeletons. Ensure `RoadmapView` and `Dashboard` have matching fidelity skeletons.
- **Colors**: Verify that status colors (Todo/In Progress/Done) are consistent across all views (Kanban vs Roadmap vs Activity Feed).
