# Claude TODO - UI & Component Modernization

**Goal:** Update base UI, enforce component reusability, and complete manual polish tasks.

## 📦 Phase 1: Component Consolidation (High Priority)

**Objective:** Replace raw HTML/inputs with reusable UI components to ensure consistency.

- [ ] **Form Consolidation** (Ref: `UI_TODO.md` #1)
  - [ ] `CommandPalette.tsx`: Replace inputs with `Input` component
  - [ ] `CustomFieldsManager.tsx`: Use `Select` and `Input` components
  - [ ] `DocumentEditor.tsx`: Standardize toolbar inputs
  - [ ] `GlobalSearch.tsx`: Use standard search input
  - [ ] `SprintManager.tsx`: Standardize date pickers and inputs
  - [ ] `WorkflowEditor.tsx`: Standardize form elements
  - [ ] `CreateIssueModal.tsx`: Ensure full usage of `Form` components

## 🎨 Phase 2: Base UI & Responsive Polish

**Objective:** Ensure the base UI is fully responsive and mobile-friendly.

- [ ] **Responsive Design** (Ref: `UI_TODO.md` #2)
  - [ ] `NotificationCenter.tsx`: Fix fixed width issues on mobile
  - [ ] **Modals**: Ensure all modals have max-width and scroll on small screens
  - [ ] **Tables**: Convert table layouts to card layouts on mobile (using `hidden md:block` patterns)

## ♿ Phase 3: Accessibility & Standards

**Objective:** Meet WCAG standards and improve code quality.

- [ ] **Accessibility** (Ref: `UI_TODO.md` #3)

  - [ ] Audit buttons for missing `aria-label`
  - [ ] Ensure custom dropdowns support keyboard navigation
  - [ ] Verify color contrast in dark mode

- [ ] **TypeScript Strictness**
  - [ ] Remove `as any` casts where possible
  - [ ] Add strict null checks for optional props

## 🛠️ Manual Tasks & Verification

**Objective:** Tasks requiring manual intervention or verification.

- [ ] **Visual Verification**: Manually verify the "wow" factor of the new UI elements.
- [ ] **Theme Check**: Toggle between Dark/Light mode to ensure no hardcoded colors break the theme.
- [ ] **Mobile Check**: Open DevTools in mobile view and verify navigation flows.
