# Design Perfection Protocol

> **Goal**: Achieve Mintlify-level polish through iterative, measurable quality passes
> **Acceptance Threshold**: 75% subagent approval per phase before advancing
> **Component Standard**: 100% quality - nothing less accepted

---

## Execution Model

```
FOR EACH phase IN [1, 2, 3, 4]:
    REPEAT:
        EXECUTE phase tasks
        SPAWN review subagents
        COLLECT acceptance scores

        IF any_score < 75%:
            FIX identified issues
            CONTINUE loop
        ELSE:
            ADVANCE to next phase

UNTIL all phases pass at 75%+
```

---

## Phase Overview

| Phase | Focus | Acceptance Criteria | Status |
|-------|-------|---------------------|--------|
| **1** | [Components](docs/design-perfection/PHASE_1_COMPONENTS.md) | Storybook setup, 100% component quality | PENDING |
| **2** | [Structure](docs/design-perfection/PHASE_2_STRUCTURE.md) | Clean layout across all viewports | PENDING |
| **3** | [Color](docs/design-perfection/PHASE_3_COLOR.md) | 100% semantic tokens, no visual anomalies | PENDING |
| **4** | [Docs Sync](docs/design-perfection/PHASE_4_DOCS_SYNC.md) | Mintlify docs updated, TODOs extracted & executed | PENDING |

---

## Phase 1: Component Foundation

**Doc**: `docs/design-perfection/PHASE_1_COMPONENTS.md`

### Objective
Every UI component in `src/components/ui/` must be bulletproof - documented, tested, and visually consistent.

### Key Tasks
1. **Set up Storybook** for component documentation
2. **Create stories** for every component variant and state
3. **Visual audit** - each component reviewed by subagent
4. **Fix issues** until 100% component quality

### Subagent Review Protocol
- 1 subagent per component category (buttons, cards, inputs, etc.)
- Must achieve 100% approval (components are foundation)
- Any issue = fix before proceeding

### Completion Gate
- [ ] Storybook running locally
- [ ] All UI components have stories
- [ ] All variants documented
- [ ] All states covered (hover, focus, disabled, loading, error)
- [ ] Subagent approval: 100%

---

## Phase 2: Structural Polish

**Doc**: `docs/design-perfection/PHASE_2_STRUCTURE.md`

### Objective
Every screen must be structurally clean across desktop, tablet, and mobile.

### Key Tasks
1. **Layout audit** - grid alignment, spacing consistency
2. **Typography hierarchy** - clear visual hierarchy on every screen
3. **Responsive behavior** - proper stacking, no overflow, no cramping
4. **Component usage** - `<Flex>` not raw divs, `<Typography>` not raw tags

### Subagent Review Protocol
- 1 subagent for desktop screenshots
- 1 subagent for tablet screenshots
- 1 subagent for mobile screenshots
- Each reviews ALL screens in their viewport

### Review Checklist (per screen)
- [ ] 8px spacing grid consistent
- [ ] Typography hierarchy clear (H1 > H2 > body > caption)
- [ ] No layout overflow or cramping
- [ ] Proper responsive stacking
- [ ] Empty states designed
- [ ] Loading skeletons match final content

### Completion Gate
- [ ] Desktop subagent: 75%+ approval
- [ ] Tablet subagent: 75%+ approval
- [ ] Mobile subagent: 75%+ approval

---

## Phase 3: Color & Visual Polish

**Doc**: `docs/design-perfection/PHASE_3_COLOR.md`

### Objective
100% semantic token usage. No visual anomalies. Dark/light parity.

### Key Tasks
1. **Color audit** - grep for hardcoded colors, arbitrary Tailwind
2. **Token compliance** - replace all with semantic tokens
3. **Dark/light parity** - both modes look intentional, not broken
4. **Visual anomaly hunt** - anything that looks "off" gets fixed

### Subagent Review Protocol
- 1 subagent reviews EVERY desktop screenshot individually
- Flag anything non-standard, weird, or off-brand
- Specific focus: shadows, borders, text contrast, hover states

### Review Checklist (per screen)
- [ ] No hardcoded hex/rgb colors
- [ ] No arbitrary Tailwind brackets for colors
- [ ] Shadows consistent (`shadow-card`, not `shadow-sm`)
- [ ] Borders using semantic tokens
- [ ] Text contrast meets WCAG AA
- [ ] Dark mode looks intentional (not inverted accident)
- [ ] Light mode polished (subtle shadows, clear hierarchy)

### Completion Gate
- [ ] 0 hardcoded colors in codebase
- [ ] 0 arbitrary color brackets
- [ ] Validator passes with 0 color warnings
- [ ] Subagent approval: 75%+

---

## Phase 4: Docs Sync

**Doc**: `docs/design-perfection/PHASE_4_DOCS_SYNC.md`

### Objective
Mintlify design docs are current, TODOs are extracted and executed.

### Key Tasks
1. **Audit `docs/design-system/`** - mark completed items
2. **Extract actionable TODOs** from all spec files
3. **Execute or delegate** each TODO
4. **Update docs** with new patterns discovered

### Files to Audit
- `docs/design-system/MASTER_PLAN.md` - Update phase checklists
- `docs/design-system/INDEX.md` - Update status table
- `docs/design-system/pages/*.md` - 13 page specs
- `docs/design-system/components/*.md` - 13 component specs
- `docs/design-system/tokens/*.md` - 4 token docs

### Subagent Review Protocol
- 1 subagent audits all docs for accuracy
- Extract all unchecked TODOs into actionable list
- Prioritize by impact

### Completion Gate
- [ ] All completed items marked in MASTER_PLAN.md
- [ ] All page specs have current screenshots referenced
- [ ] All component specs match actual implementation
- [ ] Extracted TODOs documented and prioritized
- [ ] High-priority TODOs executed

---

## Review Subagent Instructions

When spawned as a review subagent:

### 1. Screenshot Review (Phases 2-3)
```
FOR EACH screenshot in assigned set:
    ANALYZE for:
        - Structural issues (layout, spacing, typography)
        - Color issues (consistency, contrast, token usage)
        - Visual anomalies (anything that looks wrong)

    SCORE: PASS / FAIL with specific issues listed

CALCULATE overall acceptance: (PASS count / total) * 100
RETURN acceptance score + detailed issue list
```

### 2. Component Review (Phase 1)
```
FOR EACH component story:
    CHECK:
        - All variants covered
        - All states covered (hover, focus, disabled, loading)
        - Consistent with design tokens
        - Accessible (focus rings, aria labels)

    SCORE: 0-100% per component

RETURN component scores + specific issues
```

### 3. Docs Review (Phase 4)
```
FOR EACH doc file:
    COMPARE spec vs actual implementation
    IDENTIFY outdated sections
    EXTRACT unchecked TODOs

RETURN:
    - Accuracy score
    - List of outdated sections
    - Prioritized TODO list
```

---

## Iteration Log

Track each pass through the protocol:

| Date | Phase | Iteration | Score | Issues Fixed | Notes |
|------|-------|-----------|-------|--------------|-------|
| | | | | | |

---

## Related Documentation

### Design System Specs (Reference)
- `docs/design-system/MASTER_PLAN.md` - Full design system roadmap
- `docs/design-system/INDEX.md` - Comprehensive entry point
- `docs/design-system/pages/*.md` - 13 page specifications
- `docs/design-system/components/*.md` - 13 component specifications
- `docs/design-system/tokens/*.md` - Token documentation

### Screenshots (Current State)
- `e2e/screenshots/desktop-dark/` - Desktop dark mode (primary)
- `e2e/screenshots/tablet-light/` - Tablet light mode
- `e2e/screenshots/mobile-light/` - Mobile light mode

### Feature TODOs
- `TODO.md` - Active feature/tech debt items

---

## Quick Commands

```bash
# Capture fresh screenshots
pnpm screenshots

# Run validators
node scripts/validate.js

# Check for arbitrary Tailwind
node scripts/validate/check-arbitrary-tw.js

# Run component tests
pnpm test

# Start Storybook (after setup)
pnpm storybook
```

---

*This is an executable protocol. Run iteratively until all phases achieve 75%+ acceptance.*
