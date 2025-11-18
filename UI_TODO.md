# UI Improvements TODO

**Last Updated**: November 18, 2025
**Branch**: `claude/polish-responsive-design-017FHpMYjCyhpgyb2rCXeir1`

---

## 🔴 HIGH PRIORITY (Next Sprint)

### 1. Duplicate Input Field Styling (46+ remaining instances)
**Effort**: 2-3 hours remaining
**Impact**: High - continued consistency improvements

**Status**: Partially complete - form components created, 6 files refactored

**Files Remaining** (14+ files with raw inputs):
- CreateIssueModal.tsx
- IssueDetailModal.tsx
- Settings.tsx (multiple sections)
- SprintManager.tsx
- WorkflowEditor.tsx
- And 10+ more...

**Next Steps**:
- Replace remaining raw inputs with form components from `/src/components/ui/form/`
- Available components: Input, Select, Textarea, Checkbox

---

### 2. Extract Large Components (4 files remaining)
**Effort**: 6-9 hours remaining
**Impact**: High - improved testability and maintainability

#### 2a. Settings.tsx (648 LOC → ~150 LOC)
**Status**: Not started - already has internal components
**Files to Create**:
- `/src/components/Settings/GitHubIntegration.tsx`
- `/src/components/Settings/GoogleCalendarIntegration.tsx`
- `/src/components/Settings/LinkedRepositories.tsx`
- `/src/components/Settings/OfflineTab.tsx`
- `/src/components/Settings/PreferencesTab.tsx`

**Effort**: 3-4 hours

#### 2b. IssueDetailModal.tsx (435 LOC → ~200 LOC)
**Components to Extract**:
- `IssueMetadataSection` - Lines 230-270
- `SubtasksList` - Lines 350-400
- `IssueActivityTab` - Complex, needs own file

**Effort**: 2-3 hours

#### 2c. KanbanBoard.tsx (420 LOC → ~250 LOC)
**Components to Extract**:
- `KanbanColumn` - Drag-drop column logic
- `KanbanCard` - Individual issue card
- `BoardFilters` - Filter controls

**Effort**: 2-3 hours

#### 2d. AnalyticsDashboard.tsx (400+ LOC → ~200 LOC)
**Components to Extract**:
- `VelocityChart` - Team velocity visualization
- `BurndownChart` - Sprint burndown
- `IssueDistributionChart` - Pie/bar charts

**Effort**: 2-3 hours

---

### 3. Responsive Design Pass
**Effort**: 2-3 hours
**Impact**: Medium - better mobile/tablet experience

**Components Missing Responsive Breakpoints**:
- Dashboard.tsx - Grid layouts need `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- AnalyticsDashboard.tsx - Charts need mobile stacking
- Settings.tsx - Form layouts need responsive widths
- KanbanBoard.tsx - Horizontal scroll on mobile
- NotificationCenter.tsx - Fixed width needs adjustment
- TimerWidget.tsx - Positioning issues on small screens

**Pattern to Apply**:
```tsx
// Container grids:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Width constraints:
<div className="w-full sm:max-w-md lg:max-w-lg">

// Padding/spacing:
<div className="p-2 sm:p-4 lg:p-6">

// Text sizes:
<h1 className="text-xl sm:text-2xl lg:text-3xl">
```

---

## 🟡 MEDIUM PRIORITY (Future Sprint)

### 4. Accessibility Improvements
**Effort**: 3-4 hours
**Impact**: High - WCAG compliance

**Issues Found**:
- 20+ buttons missing `aria-label`
- Form inputs not associated with labels
- Custom dropdowns missing keyboard navigation
- Focus indicators inconsistent
- Color contrast issues in dark mode

**Files to Audit**:
- CommandPalette.tsx - Keyboard nav is good, but missing some labels
- GlobalSearch.tsx - Missing aria-labels on result links
- NotificationBell.tsx - Button needs better label
- ProjectBoard.tsx - Drag-drop needs keyboard alternative

### 5. Performance Optimizations
**Effort**: 2-3 hours
**Impact**: Medium - faster rendering

**Opportunities**:
- Add `React.memo` to frequently re-rendered components
- Use `useMemo` for expensive calculations (sorting, filtering)
- Implement virtual scrolling for long lists
- Lazy load heavy components (charts, calendar)

**Files to Optimize**:
- IssueCard.tsx - Memoize card rendering
- KanbanBoard.tsx - Virtual columns for large boards
- Dashboard.tsx - Lazy load charts
- AnalyticsDashboard.tsx - Debounce filter changes

### 6. Extract Hardcoded Values to Constants
**Effort**: 1-2 hours
**Impact**: Low - easier to maintain

**Create**: `/src/lib/constants.ts`
```tsx
export const ANIMATION_DELAYS = {
  stagger: 50,
  fast: 150,
  medium: 300,
  slow: 500,
};

export const DISPLAY_LIMITS = {
  quickStats: 5,
  recentActivity: 10,
  searchResults: 20,
  notifications: 50,
};

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};
```

**Files with Hardcoded Values**:
- Dashboard.tsx - Animation delays, display limits
- NotificationCenter.tsx - Notification limits
- GlobalSearch.tsx - Result limits
- IssueCard.tsx - Stagger animations

---

## 🟢 LOW PRIORITY (Tech Debt)

### 7. TypeScript Strictness
**Effort**: 2-3 hours

- Remove `as any` type casts (mostly in test files)
- Add proper types for Convex query results
- Strict null checks for optional props

### 8. Component Documentation
**Effort**: 3-4 hours

- Add JSDoc comments to all exported components
- Document complex props interfaces
- Add usage examples for reusable components

### 9. Test Coverage
**Effort**: 8+ hours

- Add tests for form components
- Test responsive behavior
- Test accessibility features
- Integration tests for modals

---

## 📊 Progress Tracking

### Overall Progress
- ✅ **Form Components Created**: 4/4 (100%)
- ⏳ **Form Field Replacement**: 6/20+ files (30%)
- ✅ **Dashboard Extraction**: 1/1 (100%)
- ⏳ **Component Extraction**: 1/5 (20%)
- ⏳ **Responsive Pass**: 0/6 (0%)

### Estimated Remaining Effort
- High Priority: 8-12 hours
- Medium Priority: 8-11 hours
- Low Priority: 13-17 hours
- **Total**: 29-40 hours (~1 week of focused work)

---

## 🎯 Recommended Next Steps

### Option A: Continue Form Consolidation (2-3 hours)
Complete the form component replacement:
1. Replace inputs in CreateIssueModal.tsx (1 hour)
2. Replace inputs in IssueDetailModal.tsx (1 hour)
3. Replace inputs in Settings.tsx (1 hour)

### Option B: Extract Another Large Component (2-3 hours)
Continue component extraction momentum:
1. Extract IssueDetailModal.tsx components
2. Test individual components
3. Verify no regressions

### Option C: Responsive Design Pass (2-3 hours)
Improve mobile/tablet experience:
1. Add responsive breakpoints to AnalyticsDashboard.tsx
2. Fix KanbanBoard.tsx mobile scroll
3. Adjust NotificationCenter.tsx and TimerWidget.tsx

**Recommendation**: Start with **Option A** - completing form consolidation provides the most immediate impact with consistent UX across all forms.

---

## 📝 Notes

- All changes should be made on the current feature branch
- Run `pnpm typecheck && pnpm lint` before committing
- Update this file as tasks are completed
- Add test coverage for new components
- Maintain backward compatibility
