# UI Components Refactoring Checklist

## Quick Reference Guide for Priority Issues

---

## 🔴 CRITICAL BUGS (Fix First)

### [ ] 1. IssueDetailModal - Mobile Responsive Grid
**File**: `/src/components/IssueDetailModal.tsx`
**Line**: 66
**Issue**: Grid with `grid-cols-2` breaks on mobile
**Fix**:
```tsx
// Before:
<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">

// After:
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
```

### [ ] 2. FilterBar - Undefined CSS Class
**File**: `/src/components/FilterBar.tsx`
**Lines**: 108, 183
**Issue**: `primary-hover` class doesn't exist in Tailwind config
**Fix**:
```tsx
// Before:
className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover"

// After:
className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
```

### [ ] 3. CreateIssueModal - Missing Implementation
**File**: `/src/components/CreateIssueModal.tsx`
**Line**: 15
**Issue**: Interface shows `defaultStatus` prop but not implemented
**Current State**: The prop exists but may not be used correctly
**Verification**: Check if `defaultStatus` is being set somewhere

---

## 🟡 HIGH PRIORITY (This Sprint)

### [ ] 4. Remove Duplicate Priority/Type Logic
**File**: `/src/components/Dashboard.tsx`
**Lines**: 47-92
**Issue**: Functions already exist in `/lib/issue-utils.ts`
**Steps**:
1. Remove `getPriorityColor()` function (lines 47-62)
2. Remove `getTypeIcon()` function (lines 64-75)
3. Remove `getActionIcon()` function (lines 77-92)
4. Add import at top:
   ```tsx
   import { getPriorityColor, getTypeIcon } from "@/lib/issue-utils";
   ```
5. Update usage in JSX from inline function to imported utility

**Files to Check**: CalendarView.tsx (may have similar issue)

### [ ] 5. Consolidate 22 Modal Backdrop Patterns
**Affected Files**:
- TimeLogModal.tsx (lines 53-60)
- IssueDetailModal.tsx (lines 36-37)
- FilterBar.tsx (line 135-140)
- CommandPalette.tsx (lines 85-96)
- GlobalSearch.tsx (lines 99-110)
- CreateEventModal.tsx
- IssueDependencies.tsx
- MentionInput.tsx
- TimeLogModal.tsx
- And 12+ more

**Option A - Use Existing Modal Component**:
```tsx
// Instead of custom backdrop, use Modal.tsx:
import { Modal } from "./ui/Modal";

return (
  <Modal isOpen={isOpen} onClose={onClose} title="My Title">
    {/* Your content here */}
  </Modal>
);
```

**Option B - Create ModalBackdrop Component**:
If custom modals needed, create: `/src/components/ui/ModalBackdrop.tsx`

### [ ] 6. Enforce FormField Component Usage
**Files with Raw Inputs**:
- ProjectSidebar.tsx (lines 75, 82, 89, 107)
- Sidebar.tsx (lines 68, 93)
- FilterBar.tsx (line 150)
- TimeLogModal.tsx (multiple)
- CreateIssueModal.tsx (uses it correctly - reference example)

**Pattern to Replace**:
```tsx
// Before:
<input
  type="text"
  placeholder="..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
/>

// After:
<InputField
  label="Label"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="..."
/>
```

**Import to Add**:
```tsx
import { InputField, SelectField, TextareaField } from "./ui/FormField";
```

### [ ] 7. Add Responsive Sidebars
**Files**:
- Sidebar.tsx (line 61)
- ProjectSidebar.tsx (line 51)

**Pattern**:
```tsx
// Before:
<div className="w-80 bg-white dark:bg-gray-900">

// After:
<div className="w-full sm:w-96 lg:w-80 bg-white dark:bg-gray-900">
// Or with max-width for better UX:
<div className="w-full max-w-xs sm:max-w-sm lg:max-w-xs bg-white dark:bg-gray-900">
```

---

## 🟠 MEDIUM PRIORITY (Upcoming Sprint)

### [ ] 8. Extract Oversized Components

#### Dashboard.tsx (444 lines → 4 components)
**Extract Components**:

1. **DashboardStats.tsx** (extract lines 108-200)
   - Stats card grid
   - Dependencies: useQuery for stats

2. **DashboardIssuesList.tsx** (extract lines 204-309)
   - Issues table/list view
   - Filter tabs

3. **DashboardProjectsList.tsx** (extract lines 313-372)
   - Projects list
   - Role badges

4. **DashboardActivityFeed.tsx** (extract lines 375-438)
   - Activity timeline

**Keep in Dashboard.tsx**: Container, routing, state management

---

#### Settings.tsx (648 lines → Multiple)
**Extract to**: `/src/components/settings/`
1. `SettingsLabels.tsx` - Labels manager
2. `SettingsTemplates.tsx` - Templates manager
3. `SettingsWebhooks.tsx` - Webhooks manager
4. `SettingsAutomation.tsx` - Automation rules
5. `SettingsCustomFields.tsx` - Custom fields

---

#### IssueDetailModal.tsx (435 lines → Smaller)
**Extract**:
1. `IssueMetadata.tsx` - Status, priority, assignee, etc.
2. `IssueDescription.tsx` - Title and description editor
3. Extract comments to: `IssueComments.tsx` (already exists, review integration)
4. Extract tracking to: `IssueTimeTracking.tsx` (optimize imports)

---

#### KanbanBoard.tsx (420 lines)
**Extract**:
1. `KanbanColumn.tsx` - Single column component
2. `KanbanCardList.tsx` - Card list in column
3. `UndoRedoControls.tsx` - Undo/redo button bar

---

### [ ] 9. Create Custom Hooks

Create `/src/hooks/` directory with:

**useKeyboardShortcuts.ts**
```tsx
export function useKeyboardShortcuts(shortcuts: {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
}[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        if (e.key === shortcut.key && 
            (shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey) &&
            (shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey)) {
          e.preventDefault();
          shortcut.handler();
        }
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
```

**Used in**: GlobalSearch.tsx, CommandPalette.tsx, KanbanBoard.tsx

---

**useModal.ts**
```tsx
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(!isOpen),
  };
}
```

**Used in**: KanbanBoard.tsx, IssueDetailModal.tsx, CreateProjectFromTemplate.tsx

---

**useFormReset.ts** (for Sidebar, ProjectSidebar patterns)
```tsx
export function useFormReset<T>(initialValues: T) {
  const [values, setValues] = useState(initialValues);
  
  const reset = () => setValues(initialValues);
  const update = (newValues: Partial<T>) => 
    setValues(v => ({ ...v, ...newValues }));
  
  return { values, reset, update };
}
```

---

### [ ] 10. Standardize Responsive Grid System

Create `/src/lib/responsive-grid.ts`:
```tsx
export const RESPONSIVE_GRID = {
  // Mobile-first approach
  base: 'grid-cols-1',
  
  // Two column layout
  twoCol: {
    base: 'grid-cols-1',
    tablet: 'sm:grid-cols-2',
    desktop: 'lg:grid-cols-2',
  },
  
  // Three column layout
  threeCol: {
    base: 'grid-cols-1',
    tablet: 'sm:grid-cols-2',
    desktop: 'lg:grid-cols-3',
  },
  
  // Four column layout
  fourCol: {
    base: 'grid-cols-1',
    tablet: 'sm:grid-cols-2',
    desktop: 'lg:grid-cols-4',
  },
};

export const gridClass = (layout: 'twoCol' | 'threeCol' | 'fourCol') => 
  `${RESPONSIVE_GRID[layout].base} ${RESPONSIVE_GRID[layout].tablet} ${RESPONSIVE_GRID[layout].desktop}`;
```

**Usage**:
```tsx
import { gridClass } from '@/lib/responsive-grid';

// In Dashboard.tsx:
<div className={`${gridClass('fourCol')} gap-4 mb-6`}>
```

---

### [ ] 11. Extract Animation Constants

Create `/src/lib/animation-constants.ts`:
```tsx
// Stagger delays for sequential animations
export const ANIMATION = {
  STAGGER_DELAY_MS: 50,
  COLUMN_STAGGER_DELAY_MS: 100,
  ISSUE_STAGGER_OFFSET_MS: 50,
  
  // Durations
  FADE_DURATION_MS: 200,
  SLIDE_DURATION_MS: 200,
  SCALE_DURATION_MS: 200,
};

// Helper function
export const getStaggerDelay = (index: number, baseDelay = ANIMATION.STAGGER_DELAY_MS) => 
  `${index * baseDelay}ms`;

export const getColumnStaggerDelay = (columnIndex: number, issueIndex: number) =>
  `${columnIndex * ANIMATION.COLUMN_STAGGER_DELAY_MS + issueIndex * ANIMATION.ISSUE_STAGGER_OFFSET_MS}ms`;
```

**Replace in**:
- Dashboard.tsx (line 276)
- KanbanBoard.tsx (lines 330, 375)

---

## 🟢 LOW PRIORITY (Nice to Have)

### [ ] 12. Add Accessibility Labels
**Checklist Items**:
- [ ] All `role="button"` elements have `aria-label`
- [ ] All form inputs have associated labels
- [ ] All custom interactive elements support keyboard navigation
- [ ] Modal headers have `id` and are referenced by `aria-labelledby`

**Key Files to Audit**:
- Dashboard.tsx
- Sidebar.tsx
- ProjectSidebar.tsx
- FilterBar.tsx
- GlobalSearch.tsx

---

### [ ] 13. Standardize Error Handling
**Current Patterns**:
1. Some use `toast.error("message")`
2. Some use `showError(error, "message")`
3. Some ignore the error entirely

**Standardize to**:
```tsx
import { showError, showSuccess } from "@/lib/toast";

try {
  // operation
  showSuccess("Success message");
} catch (error) {
  showError(error, "User-friendly message");
}
```

**Files to Update**:
- Sidebar.tsx
- ProjectSidebar.tsx
- FilterBar.tsx
- TimeLogModal.tsx

---

### [ ] 14. Create Dark Mode Configuration
**File**: `/src/styles/dark-mode-palette.ts`
```tsx
export const DARK_MODE_COLORS = {
  // Backgrounds
  bg: {
    primary: 'dark:bg-gray-900',
    secondary: 'dark:bg-gray-800',
    tertiary: 'dark:bg-gray-700',
  },
  
  // Text
  text: {
    primary: 'dark:text-gray-100',
    secondary: 'dark:text-gray-300',
    tertiary: 'dark:text-gray-400',
  },
  
  // Borders
  border: {
    primary: 'dark:border-gray-700',
    secondary: 'dark:border-gray-600',
  },
};
```

---

### [ ] 15. Document Magic Numbers
**Create**: `/src/constants/magic-numbers.ts`
```tsx
// Query limits
export const SEARCH_RESULT_LIMIT = 10;
export const SAVED_FILTERS_DISPLAY_LIMIT = 5;

// Sizes
export const SIDEBAR_WIDTH = '320px'; // w-80
export const MODAL_MAX_WIDTH = '672px'; // max-w-2xl

// Thresholds
export const MIN_QUERY_LENGTH = 2;
export const MAX_HISTORY_SIZE = 10; // undo/redo
```

---

## Summary Table

| Issue | Files | Severity | Effort | Impact |
|-------|-------|----------|--------|--------|
| Mobile grid crash | IssueDetailModal.tsx | 🔴 | 5min | High |
| Undefined CSS class | FilterBar.tsx | 🔴 | 10min | High |
| Duplicate utils | Dashboard.tsx | 🟡 | 15min | Medium |
| Modal backdoors | 22 files | 🟡 | 2hrs | High |
| FormField usage | 10+ files | 🟡 | 2hrs | Medium |
| Component extraction | 5 files | 🟠 | 8hrs | Medium |
| Hook extraction | 3 hooks | 🟠 | 4hrs | Medium |
| Responsive fix | 2 files | 🟡 | 1hr | Medium |

---

## Testing Checklist

After making each change, verify:

- [ ] Component renders without errors
- [ ] Responsive design works on mobile (< 640px)
- [ ] Responsive design works on tablet (640px - 1024px)
- [ ] Responsive design works on desktop (> 1024px)
- [ ] Dark mode toggle works (if applicable)
- [ ] Form submissions work
- [ ] No console errors or warnings
- [ ] Keyboard navigation works
- [ ] Screen reader reads labels correctly (if accessibility changes)

---

## Rollout Plan

### Week 1: Critical Bugs
- Fix IssueDetailModal mobile grid
- Fix FilterBar undefined class
- Remove Dashboard duplicate utils

### Week 2: Consolidation
- Consolidate modal backdoors
- Enforce FormField usage
- Add responsive sidebars

### Week 3: Extraction
- Extract oversized components
- Create custom hooks
- Extract animation constants

### Week 4: Polish
- Add accessibility labels
- Standardize error handling
- Create dark mode config
- Document magic numbers

