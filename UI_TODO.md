# UI Architectural Review & TODOs

This document outlines critical user interface and frontend architecture gaps found during a comprehensive review, with a focus on performance, scalability, and "Power User" experience.

## 🛠 Medium Priority (UX & Polish)

### 1. Customizable Dashboard Layout

**Current State**: The dashboard layout is hardcoded in a grid.
**Recommendation**:

- Allow users to toggle widgets on/off (e.g., "Hide Recent Activity").
- Store user preferences in `userSettings` table (Convex).

### 2. "Power User" Keyboard Navigation

**Current State**: Basic keyboard support exists via `useListNavigation`.
**Recommendation**:

- Expand coverage: Ensure typical "J/K" navigation works on **all** lists (Roadmap, Kanban columns).
- Add a global "Command Palette" (`Cmd+K`) for jumping to projects or creating issues from anywhere (component exists, ensure it's globally mounted).

---

## 🔍 Visual & Aesthetics

### 3. Consistency Check

- **Loading States**: `KanbanBoard` has nice Skeletons. Ensure `RoadmapView` and `Dashboard` have matching fidelity skeletons.
- **Colors**: Verify that status colors (Todo/In Progress/Done) are consistent across all views (Kanban vs Roadmap vs Activity Feed).
