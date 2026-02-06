# Nixelo - Comprehensive Cleanup & Screenshot Plan

> **Created:** 2026-02-05
> **Status:** COMPLETE

---

## Overview

This plan consolidates outstanding work for the design system refresh, screenshot infrastructure, and documentation cleanup.

---

## 1. Screenshot Infrastructure Overhaul

### Current State
- Script: `e2e/screenshot-pages.ts`
- Only captures one viewport (1920x1080)
- Supports `--light`, `--dark`, `--no-preference` but not all at once
- No responsive variations

### Target State
Capture key viewport/theme combinations:

```
e2e/screenshots/
├── desktop-dark/           # 1920x1080, dark mode (primary)
│   ├── 01-public-landing.png
│   ├── 01-empty-dashboard.png
│   ├── 01-filled-dashboard.png
│   └── ...
├── tablet-light/           # 768x1024, light mode
│   └── ...
└── mobile-light/           # 390x844, light mode
    └── ...
```

### Implementation Tasks

- [x] **1.1** Update `screenshot-pages.ts` to support multiple viewports
  - Added `VIEWPORTS` config: `{ desktop: 1920x1080, tablet: 768x1024, mobile: 390x844 }`
  - Added `CONFIGS` array for specific viewport/theme combinations
  - Captures: desktop-dark, tablet-light, mobile-light

- [x] **1.2** Update output directory structure
  - Created subdirectories per viewport/theme combination
  - Updated filename convention: `{NN}-{prefix}-{page}.png`

- [x] **1.3** Script captures all 3 configs in a single run
  - `pnpm screenshots` captures all combinations

- [x] **1.4** Run full screenshot capture
  - **128 screenshots** captured across 3 directories

---

## 2. Design System Documentation Cleanup

### Current State
- `docs/design-system/MASTER_PLAN.md` - Comprehensive but many items unchecked
- `docs/design-system/pages/*.md` - Page specs exist but have TODOs
- `docs/design-system/components/*.md` - Component specs exist but incomplete
- `docs/design-system/tokens/*.md` - Token docs exist

### Tasks

- [ ] **2.1** Audit `MASTER_PLAN.md` - Mark completed items from Phase 1 & 2
  - Phase 1 (Foundation) was implemented
  - Phase 2 (Core Components) was partially implemented

- [ ] **2.2** Update page spec files with current screenshots
  - Reference new screenshot paths once captured
  - Update "Current State" sections
  - Mark implemented features as complete

- [ ] **2.3** Update component spec files
  - Document actual implementations vs specs
  - Add code examples from current components

- [ ] **2.4** Update `docs/design-system/INDEX.md`
  - Add progress summary
  - Link to all spec files

---

## 3. TODO Consolidation

### Current TODO Locations
1. `TODO.md` - Main project todos (features, tech debt, E2E gaps)
2. `docs/design-system/MASTER_PLAN.md` - Design system todos
3. Various `docs/design-system/**/*.md` - Page/component todos

### Tasks

- [ ] **3.1** Audit `TODO.md` - Remove completed items, update status

- [ ] **3.2** Cross-reference design system TODOs
  - Items completed in code but not marked in docs

- [ ] **3.3** Create unified progress tracking
  - Add status badges to MASTER_PLAN.md sections
  - Add last-updated timestamps

---

## 4. Immediate Cleanup

### Already Done
- [x] Fix form.tsx import conflict (created re-export file)
- [x] Remove outdated screenshots
- [x] Screenshot infrastructure overhaul complete

### Pending
- [ ] **4.1** Commit all changes
- [ ] **4.2** Update `.auth/` - regenerate auth states (currently expired)

---

## 5. Execution Order

### Phase A: Infrastructure (Do First)
1. Update screenshot script for multi-viewport support
2. Run comprehensive screenshot capture
3. Commit all screenshots

### Phase B: Documentation (After Screenshots)
1. Update MASTER_PLAN.md with completed items
2. Update page specs with new screenshot references
3. Update component specs
4. Consolidate TODOs

### Phase C: Ongoing
1. Re-run screenshots after any UI changes
2. Keep docs in sync with implementation

---

## 6. Viewport Specifications

| Name | Width | Height | Use Case |
|------|-------|--------|----------|
| Desktop | 1920 | 1080 | Full desktop experience |
| Tablet | 768 | 1024 | iPad portrait |
| Mobile | 390 | 844 | iPhone 14 Pro |

## 7. Theme Specifications

| Theme | Color Scheme | Primary BG |
|-------|--------------|------------|
| Dark | `dark` | Near-black (#0a0a0b) |
| Light | `light` | White (#ffffff) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `e2e/screenshot-pages.ts` | Multi-viewport, multi-theme support |
| `package.json` | New screenshot scripts |
| `docs/design-system/MASTER_PLAN.md` | Mark completed phases |
| `docs/design-system/pages/*.md` | Update screenshot refs |
| `TODO.md` | Remove completed items |

---

## Success Criteria

- [x] 3 screenshot directories (desktop-dark, tablet-light, mobile-light)
- [x] ~43 screenshots per directory (128 total)
- [ ] All design-system docs reference correct screenshots
- [ ] MASTER_PLAN.md accurately reflects implementation status
- [ ] TODO.md is current and actionable

---

*This plan supersedes any conflicting instructions in other docs.*
