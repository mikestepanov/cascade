# UI Improvements TODO

**Last Updated**: November 18, 2025 (Session Summary)
**Branch**: `claude/polish-responsive-design-017FHpMYjCyhpgyb2rCXeir1`

---

## 📊 Recent Accomplishments

### ✅ Completed (November 2025)
- ✅ **Major Component Extractions** (1,036+ lines removed)
  - Dashboard: 416 → 151 lines (-64%)
  - KanbanBoard: 420 → 305 lines (-27%)
  - Settings: 648 → 89 lines (-86%)
  - AnalyticsDashboard: 269 → 172 lines (-36%)
  - IssueDetailModal: Partially extracted

- ✅ **18 New Reusable Components Created**
  - 4 form components (Input, Select, Textarea, Checkbox)
  - 3 Dashboard components (QuickStats, RecentActivity, MyIssuesList)
  - 2 Kanban components (BoardToolbar, KanbanColumn)
  - 5 Settings components (GitHub, Google Calendar, Offline, etc.)
  - 4 Analytics components (MetricCard, ChartCard, BarChart, etc.)

- ✅ **Form Component Adoption** (8 files refactored)
  - Sidebar.tsx, ProjectSidebar.tsx, TimeLogModal.tsx
  - FilterBar.tsx, AutomationRulesManager.tsx, IssueDependencies.tsx
  - IssueDetailModal.tsx, CustomFieldValues.tsx

- ✅ **Markdown Import/Export Feature**
  - Full bidirectional markdown conversion
  - Preview modal before import
  - Batch export as ZIP
  - YAML frontmatter support
  - 43 comprehensive tests

- ✅ **Performance & Quality**
  - React.memo added to IssueCard, BarChart, MetricCard
  - Constants extraction (constants.ts)
  - Accessibility improvements (aria-labels)
  - Responsive design (TimerWidget)
  - Modal backdrop consolidation (650+ lines removed)

---

## 🔴 HIGH PRIORITY (Remaining Work)

### 1. Complete Form Consolidation (~12 files remaining)
**Effort**: 2-3 hours
**Impact**: High - final consistency pass

**Files Remaining**:
- CommandPalette.tsx
- CustomFieldsManager.tsx
- DocumentEditor.tsx
- GlobalSearch.tsx
- SprintManager.tsx
- WorkflowEditor.tsx
- CreateIssueModal.tsx
- And ~5 more minor files

**Next Steps**:
- Replace remaining raw inputs with form components from `/src/components/ui/form/`
- Available components: Input, Select, Textarea, Checkbox

---

### 2. Responsive Design - Remaining Components
**Effort**: 2-3 hours
**Impact**: Medium - better mobile/tablet experience

**Components Needing Attention**:
- NotificationCenter.tsx - Fixed width needs adjustment
- Some modal widths on mobile
- Table layouts → card layouts on mobile

**Pattern to Apply**:
```tsx
// Container grids:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Width constraints:
<div className="w-full sm:max-w-md lg:max-w-lg">

// Padding/spacing:
<div className="p-2 sm:p-4 lg:p-6">
```

---

### 3. Accessibility Improvements
**Effort**: 2-3 hours
**Impact**: High - WCAG compliance

**Issues Remaining**:
- ~15 buttons still missing `aria-label`
- Some custom dropdowns missing keyboard navigation
- Focus indicators could be more consistent
- Color contrast verification in dark mode

**Files to Audit**:
- CommandPalette.tsx - Add more aria-labels
- NotificationBell.tsx - Better aria-label
- ProjectBoard.tsx - Keyboard alternative for drag-drop

---

## 🟡 MEDIUM PRIORITY (Future Work)

### 4. Performance Optimizations
**Effort**: 2-3 hours
**Impact**: Medium - faster rendering

**Opportunities**:
- Add `useMemo` for expensive calculations (sorting, filtering)
- Implement virtual scrolling for long lists
- Lazy load heavy components (charts, calendar)

**Files to Optimize**:
- KanbanBoard.tsx - Virtual columns for large boards
- Dashboard.tsx - Lazy load charts
- AnalyticsDashboard.tsx - Debounce filter changes

---

### 5. TypeScript Strictness
**Effort**: 2-3 hours
**Impact**: Low - code quality

- Remove remaining `as any` type casts
- Add proper types for Convex query results
- Strict null checks for optional props

---

### 6. Component Documentation
**Effort**: 2-3 hours
**Impact**: Low - developer experience

- Add JSDoc comments to exported components
- Document complex props interfaces
- Add usage examples for reusable components

---

### 7. Test Coverage
**Effort**: 4-6 hours
**Impact**: Medium - confidence in changes

- Add tests for remaining form components
- Test responsive behavior
- Test accessibility features
- Integration tests for modals

---

## 📊 Progress Tracking

### Overall Progress
- ✅ **Form Components Created**: 4/4 (100%)
- ✅ **Major Component Extractions**: 4/4 (100%)
- 🟡 **Form Field Replacement**: 8/20 files (40%)
- 🟡 **Responsive Pass**: 2/6 components (33%)
- 🟡 **Accessibility**: ~60% complete

### Code Quality Metrics
- **Lines removed**: 1,036+ from major components
- **Duplicate code eliminated**: ~1,200 lines
- **New reusable components**: 18
- **TypeScript compliance**: 100% ✅
- **Test coverage**: 43 markdown tests, existing UI tests

---

## 📝 Notes

- All changes on feature branch: `claude/polish-responsive-design-017FHpMYjCyhpgyb2rCXeir1`
- Run `pnpm typecheck && pnpm lint` before committing
- Maintain backward compatibility
- Keep /research directory as-is (per user request)

---

## 🎯 Recommended Next Steps

**Option A: Complete Form Consolidation (2-3 hours)**
- High consistency impact
- Easy to verify
- Clear completion criteria

**Option B: Final Responsive Polish (2-3 hours)**
- Better mobile UX
- NotificationCenter + remaining modals
- Table → card layouts

**Option C: Accessibility Sweep (2-3 hours)**
- Add remaining aria-labels
- Keyboard navigation improvements
- WCAG compliance verification

---

**Estimated Remaining Effort**: 12-18 hours total
**Most Impactful Next**: Option A (Form Consolidation)
