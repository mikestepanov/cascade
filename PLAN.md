# Nixelo - Comprehensive Cleanup & Screenshot Plan

> **Created:** 2026-02-05
> **Status:** IN PROGRESS

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
Capture ALL variations in organized subdirectories:

```
e2e/screenshots/
├── desktop-dark/           # 1920x1080, dark mode
│   ├── 01-empty-landing.png
│   ├── 01-filled-dashboard.png
│   └── ...
├── desktop-light/          # 1920x1080, light mode
│   └── ...
├── tablet-dark/            # 768x1024, dark mode
│   └── ...
├── tablet-light/           # 768x1024, light mode
│   └── ...
├── mobile-dark/            # 390x844, dark mode
│   └── ...
└── mobile-light/           # 390x844, light mode
    └── ...
```

### Implementation Tasks

- [ ] **1.1** Update `screenshot-pages.ts` to support multiple viewports
  - Add `VIEWPORTS` config: `{ desktop: 1920x1080, tablet: 768x1024, mobile: 390x844 }`
  - Add `--all` flag to capture all combinations
  - Add `--viewport=desktop|tablet|mobile` flag for single viewport

- [ ] **1.2** Update output directory structure
  - Create subdirectories per viewport/theme combination
  - Update filename convention: `{NN}-{state}-{page}.png`

- [ ] **1.3** Update `package.json` scripts
  ```json
  "screenshots": "... --all",
  "screenshots:desktop-dark": "... --viewport=desktop --dark",
  "screenshots:desktop-light": "... --viewport=desktop --light",
  "screenshots:mobile": "... --viewport=mobile --all-themes"
  ```

- [ ] **1.4** Add `.gitkeep` to `e2e/screenshots/` subdirectories

- [ ] **1.5** Run full screenshot capture and commit

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

### Pending
- [ ] **4.1** Commit screenshot cleanup
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

- [ ] 6 screenshot directories (3 viewports × 2 themes)
- [ ] ~40 screenshots per directory (~240 total)
- [ ] All design-system docs reference correct screenshots
- [ ] MASTER_PLAN.md accurately reflects implementation status
- [ ] TODO.md is current and actionable

---

*This plan supersedes any conflicting instructions in other docs.*
