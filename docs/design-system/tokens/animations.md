# Animation Tokens

> **Source**: `docs/research/library/mintlify/landing_deep.json`
> **Motion Reference**: `docs/research/library/mintlify/*_motion.webm`
> **Last Updated**: 2026-02-05

---

## Overview

Mintlify's animation system is subtle and purposeful. Animations serve to:

1. **Guide attention** - Draw users to important elements
2. **Provide feedback** - Confirm actions have been registered
3. **Create depth** - Suggest spatial relationships
4. **Reduce cognitive load** - Smooth transitions prevent jarring context switches

**Core Principle**: Animations should feel natural and fast. If a user notices an animation, it's too slow.

---

## 1. Transition Defaults

All interactive elements should have a base transition applied.

### Global Default

```css
--duration-default: 0.2s;
--easing-default: ease-out;
--easing-enter: ease-out;
--easing-exit: ease-in;
```

### Transition Utility Classes

```css
/* Add to src/index.css @theme block */
@theme {
  --transition-fast: all 0.15s ease-out;
  --transition-default: all 0.2s ease-out;
  --transition-slow: all 0.3s ease-out;
  --transition-enter: all 0.2s ease-out;
  --transition-exit: all 0.15s ease-in;
}
```

### Usage Guidelines

| Element | Duration | Easing | Notes |
|---------|----------|--------|-------|
| Buttons | 0.15s | ease-out | Quick feedback |
| Cards | 0.2s | ease-out | Hover states |
| Modals | 0.2s | ease-out | Entry/exit |
| Dropdowns | 0.15s | ease-out | Fast reveals |
| Page transitions | 0.3s | ease-out | Noticeable but not slow |
| Loaders | Continuous | linear | Infinite rotation |

---

## 2. Entry Animations

Entry animations bring elements into view with purpose and style.

### 2.1 Enter From Right

**Purpose**: Slide-in for side panels, navigation menus, off-canvas drawers

```css
@keyframes enterFromRight {
  0% {
    opacity: 0;
    transform: translateX(200px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**ASCII Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|                |   -->  |          +-----|  --> |     +-------+  |
|                |        |          | el  |      |     |  el   |  |
|                |        |          +-----|      |     +-------+  |
+----------------+        +----------------+      +----------------+
     (invisible)            (sliding in)             (final pos)
```

**When to Use**:
- Side drawer opening
- Navigation menu sliding in from right
- Toast notifications entering from right

**Tailwind Utility**:
```css
.animate-enter-from-right {
  animation: enterFromRight 0.2s ease-out forwards;
}
```

---

### 2.2 Enter From Left

**Purpose**: Slide-in for left-side navigation, sidebar expansions

```css
@keyframes enterFromLeft {
  0% {
    opacity: 0;
    transform: translateX(-200px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**ASCII Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|                |   -->  |-----+          |  --> |  +-------+     |
|                |        | el  |          |      |  |  el   |     |
|                |        |-----+          |      |  +-------+     |
+----------------+        +----------------+      +----------------+
     (invisible)            (sliding in)             (final pos)
```

**When to Use**:
- Sidebar navigation appearing
- Left-side panels
- Back navigation transitions

**Tailwind Utility**:
```css
.animate-enter-from-left {
  animation: enterFromLeft 0.2s ease-out forwards;
}
```

---

### 2.3 Scale In (with Tilt)

**Purpose**: Modal/dialog entry, dropdown menus, popovers. The subtle rotateX creates depth.

```css
@keyframes scaleIn {
  0% {
    opacity: 0;
    transform: rotateX(-10deg) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: rotateX(0deg) scale(1);
  }
}
```

**ASCII Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|                |   -->  |                |  --> |                |
|    +------+    |        |   +--------+   |      |  +----------+  |
|    |tilted|    |        |   | dialog |   |      |  |  dialog  |  |
|    +------+    |        |   +--------+   |      |  +----------+  |
|                |        |                |      |                |
+----------------+        +----------------+      +----------------+
   (96% scale,              (scaling up,           (100% scale,
    tilted back)             untilting)              flat)
```

**When to Use**:
- Modal dialogs opening
- Dropdown menus appearing
- Tooltip/popover entry
- Context menus

**Tailwind Utility**:
```css
.animate-scale-in {
  animation: scaleIn 0.2s ease-out forwards;
  transform-origin: top center;
}
```

---

### 2.4 Generic Enter (Variable-based)

**Purpose**: Flexible entry animation using CSS custom properties for dynamic control.

```css
@keyframes enter {
  0% {
    opacity: var(--tw-enter-opacity, 1);
    transform: translate3d(
      var(--tw-enter-translate-x, 0),
      var(--tw-enter-translate-y, 0),
      0
    ) scale3d(
      var(--tw-enter-scale, 1),
      var(--tw-enter-scale, 1),
      var(--tw-enter-scale, 1)
    ) rotate(var(--tw-enter-rotate, 0));
  }
}
```

**When to Use**:
- When you need fine-grained control over entry animations
- Component-level customization
- Dynamic animation parameters

**Example Usage**:
```css
.custom-entry {
  --tw-enter-opacity: 0;
  --tw-enter-translate-y: 20px;
  --tw-enter-scale: 0.95;
  animation: enter 0.3s ease-out forwards;
}
```

---

## 3. Exit Animations

Exit animations remove elements gracefully, reversing the entry patterns.

### 3.1 Exit To Right

**Purpose**: Dismiss side panels, navigation closing

```css
@keyframes exitToRight {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(200px);
  }
}
```

**ASCII Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|     +-------+  |   -->  |          +-----|  --> |                |
|     |  el   |  |        |          | el  |      |                |
|     +-------+  |        |          +-----|      |                |
+----------------+        +----------------+      +----------------+
   (final pos)              (sliding out)          (invisible)
```

**Tailwind Utility**:
```css
.animate-exit-to-right {
  animation: exitToRight 0.15s ease-in forwards;
}
```

---

### 3.2 Exit To Left

**Purpose**: Dismiss left-side navigation, sidebar collapsing

```css
@keyframes exitToLeft {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-200px);
  }
}
```

**ASCII Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|  +-------+     |   -->  |-----+          |  --> |                |
|  |  el   |     |        | el  |          |      |                |
|  +-------+     |        |-----+          |      |                |
+----------------+        +----------------+      +----------------+
   (final pos)              (sliding out)          (invisible)
```

**Tailwind Utility**:
```css
.animate-exit-to-left {
  animation: exitToLeft 0.15s ease-in forwards;
}
```

---

### 3.3 Scale Out (with Tilt)

**Purpose**: Modal/dialog exit, dropdown closing

```css
@keyframes scaleOut {
  0% {
    opacity: 1;
    transform: rotateX(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: rotateX(-10deg) scale(0.96);
  }
}
```

**ASCII Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|                |   -->  |                |  --> |                |
|  +----------+  |        |   +--------+   |      |    +------+    |
|  |  dialog  |  |        |   | dialog |   |      |    |tilted|    |
|  +----------+  |        |   +--------+   |      |    +------+    |
|                |        |                |      |                |
+----------------+        +----------------+      +----------------+
  (100% scale,              (scaling down,         (96% scale,
     flat)                    tilting back)          tilted)
```

**Tailwind Utility**:
```css
.animate-scale-out {
  animation: scaleOut 0.15s ease-in forwards;
  transform-origin: top center;
}
```

---

### 3.4 Generic Exit (Variable-based)

**Purpose**: Flexible exit animation using CSS custom properties.

```css
@keyframes exit {
  100% {
    opacity: var(--tw-exit-opacity, 1);
    transform: translate3d(
      var(--tw-exit-translate-x, 0),
      var(--tw-exit-translate-y, 0),
      0
    ) scale3d(
      var(--tw-exit-scale, 1),
      var(--tw-exit-scale, 1),
      var(--tw-exit-scale, 1)
    ) rotate(var(--tw-exit-rotate, 0));
  }
}
```

---

## 4. Utility Animations

### 4.1 Spin (Loaders)

**Purpose**: Loading spinners, refresh icons

```css
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

**ASCII Storyboard**:
```
Frame 0%     Frame 25%    Frame 50%    Frame 75%    Frame 100%
   |            /            --            \            |
   |           /             --             \           |
   |          /              --              \          |

 (top)     (right)       (bottom)        (left)      (top)
                   ... repeats infinitely ...
```

**Tailwind Utility**:
```css
.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-spin-slow {
  animation: spin 2s linear infinite;
}

.animate-spin-fast {
  animation: spin 0.5s linear infinite;
}
```

---

### 4.2 Loader Spin (Alias)

**Purpose**: Identical to spin, alternative naming convention

```css
@keyframes loader-spin {
  100% {
    transform: rotate(1turn);
  }
}
```

**Tailwind Utility**:
```css
.animate-loader {
  animation: loader-spin 0.8s linear infinite;
}
```

---

## 5. Project-Specific Animations (Nixelo)

These are animations already defined in `src/index.css`:

### 5.1 Fade In

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

--animation-fade-in: fade-in 0.3s ease-out;
```

**When to Use**: Page loads, lazy-loaded images, skeleton-to-content transitions

---

### 5.2 Slide Up

```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

--animation-slide-up: slide-up 0.4s ease-out;
```

**ASCII Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|                |   -->  |                |  --> |  +----------+  |
|                |        |   +--------+   |      |  | content  |  |
|   +--------+   |        |   | content|   |      |  +----------+  |
|   | content|   |        |   +--------+   |      |                |
+----------------+        +----------------+      +----------------+
   (below final,            (rising up)            (final pos)
    invisible)
```

**When to Use**: Card reveals, list items, staggered content entry

---

### 5.3 Scale In (Simpler Version)

```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

--animation-scale-in: scale-in 0.2s ease-out;
```

**When to Use**: Buttons appearing, badge pops, notification dots

---

## 6. Staggered Animations

For lists and grids, stagger child animations for a cascading effect.

### CSS Implementation

```css
.stagger-children > * {
  animation: slide-up 0.4s ease-out forwards;
  opacity: 0;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
.stagger-children > *:nth-child(6) { animation-delay: 250ms; }
.stagger-children > *:nth-child(7) { animation-delay: 300ms; }
.stagger-children > *:nth-child(8) { animation-delay: 350ms; }
.stagger-children > *:nth-child(n+9) { animation-delay: 400ms; }
```

**ASCII Storyboard** (showing 4 cards):
```
T=0ms              T=50ms             T=100ms            T=150ms+
+---+              +---+              +---+              +---+
|   |              | 1 |              | 1 |              | 1 |
+---+              +---+              +---+              +---+
|   |      -->     |   |      -->     | 2 |      -->     | 2 |
+---+              +---+              +---+              +---+
|   |              |   |              |   |              | 3 |
+---+              +---+              +---+              +---+
|   |              |   |              |   |              | 4 |
+---+              +---+              +---+              +---+
```

---

## 7. Hover Microinteractions

### 7.1 Lift Effect (Cards)

```css
.hover-lift {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
```

### 7.2 Scale Effect (Buttons/Icons)

```css
.hover-scale {
  transition: transform 0.15s ease-out;
}

.hover-scale:hover {
  transform: scale(1.02);
}

.hover-scale:active {
  transform: scale(0.98);
}
```

### 7.3 Glow Effect (Brand Elements)

```css
.hover-glow {
  transition: box-shadow 0.2s ease-out;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(var(--color-brand-rgb), 0.3);
}
```

---

## 8. Ready-to-Copy CSS for src/index.css

Add this block to your `@theme` section in `src/index.css`:

```css
@theme {
  /* ============================================================
   * ANIMATIONS - Mintlify-inspired motion system
   * ============================================================ */

  /* --- Transition Tokens --- */
  --transition-fast: all 0.15s ease-out;
  --transition-default: all 0.2s ease-out;
  --transition-slow: all 0.3s ease-out;
  --duration-default: 0.2s;

  /* --- Entry Keyframes --- */
  @keyframes enterFromRight {
    0% { opacity: 0; transform: translateX(200px); }
    100% { opacity: 1; transform: translateX(0); }
  }

  @keyframes enterFromLeft {
    0% { opacity: 0; transform: translateX(-200px); }
    100% { opacity: 1; transform: translateX(0); }
  }

  @keyframes scaleIn {
    0% { opacity: 0; transform: rotateX(-10deg) scale(0.96); }
    100% { opacity: 1; transform: rotateX(0deg) scale(1); }
  }

  @keyframes enter {
    0% {
      opacity: var(--tw-enter-opacity, 1);
      transform: translate3d(
        var(--tw-enter-translate-x, 0),
        var(--tw-enter-translate-y, 0),
        0
      ) scale3d(
        var(--tw-enter-scale, 1),
        var(--tw-enter-scale, 1),
        var(--tw-enter-scale, 1)
      ) rotate(var(--tw-enter-rotate, 0));
    }
  }

  /* --- Exit Keyframes --- */
  @keyframes exitToRight {
    0% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(200px); }
  }

  @keyframes exitToLeft {
    0% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(-200px); }
  }

  @keyframes scaleOut {
    0% { opacity: 1; transform: rotateX(0deg) scale(1); }
    100% { opacity: 0; transform: rotateX(-10deg) scale(0.96); }
  }

  @keyframes exit {
    100% {
      opacity: var(--tw-exit-opacity, 1);
      transform: translate3d(
        var(--tw-exit-translate-x, 0),
        var(--tw-exit-translate-y, 0),
        0
      ) scale3d(
        var(--tw-exit-scale, 1),
        var(--tw-exit-scale, 1),
        var(--tw-exit-scale, 1)
      ) rotate(var(--tw-exit-rotate, 0));
    }
  }

  /* --- Utility Keyframes --- */
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }

  @keyframes loader-spin {
    100% { transform: rotate(1turn); }
  }

  /* --- Animation Tokens --- */
  --animation-enter-right: enterFromRight 0.2s ease-out forwards;
  --animation-enter-left: enterFromLeft 0.2s ease-out forwards;
  --animation-scale-in-tilt: scaleIn 0.2s ease-out forwards;
  --animation-exit-right: exitToRight 0.15s ease-in forwards;
  --animation-exit-left: exitToLeft 0.15s ease-in forwards;
  --animation-scale-out-tilt: scaleOut 0.15s ease-in forwards;
  --animation-spin: spin 1s linear infinite;
  --animation-loader: loader-spin 0.8s linear infinite;
}
```

---

## 9. Utility Classes (Add to CSS or as Tailwind plugin)

```css
/* Entry animations */
.animate-enter-right { animation: var(--animation-enter-right); }
.animate-enter-left { animation: var(--animation-enter-left); }
.animate-scale-in-tilt {
  animation: var(--animation-scale-in-tilt);
  transform-origin: top center;
}

/* Exit animations */
.animate-exit-right { animation: var(--animation-exit-right); }
.animate-exit-left { animation: var(--animation-exit-left); }
.animate-scale-out-tilt {
  animation: var(--animation-scale-out-tilt);
  transform-origin: top center;
}

/* Utility animations */
.animate-spin { animation: var(--animation-spin); }
.animate-spin-slow { animation: spin 2s linear infinite; }
.animate-spin-fast { animation: spin 0.5s linear infinite; }
.animate-loader { animation: var(--animation-loader); }

/* Hover microinteractions */
.hover-lift {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

.hover-scale {
  transition: transform 0.15s ease-out;
}
.hover-scale:hover { transform: scale(1.02); }
.hover-scale:active { transform: scale(0.98); }

/* Staggered animation container */
.stagger-children > * {
  animation: slide-up 0.4s ease-out forwards;
  opacity: 0;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
.stagger-children > *:nth-child(6) { animation-delay: 250ms; }
.stagger-children > *:nth-child(7) { animation-delay: 300ms; }
.stagger-children > *:nth-child(8) { animation-delay: 350ms; }
.stagger-children > *:nth-child(n+9) { animation-delay: 400ms; }
```

---

## 10. Motion Reference Videos

The following `.webm` recordings capture Mintlify's actual motion behavior:

| File | Description | Key Observations |
|------|-------------|------------------|
| `landing_motion.webm` | Landing page interactions | Smooth scroll, hover card lifts |
| `signup_motion.webm` | Auth flow animations | Form field focus, button feedback |
| `docs_motion.webm` | Documentation navigation | Sidebar transitions, page loads |
| `customer-anthropic_motion.webm` | Customer page | Image reveals, content staggers |
| `dashboard/full-exploration.webm` | Dashboard walkthrough | Panel transitions, menu opens |
| `onboarding/signup-flow.webm` | Complete signup journey | Step transitions, progress |

---

## 11. Best Practices

### DO

- Use `ease-out` for entries (elements arriving)
- Use `ease-in` for exits (elements leaving)
- Keep durations under 0.3s for UI interactions
- Use `transform` and `opacity` for performance (GPU accelerated)
- Add `will-change: transform` for frequently animated elements
- Use `transform-origin` appropriately for scale animations

### DON'T

- Animate `width`, `height`, `top`, `left` (causes layout thrashing)
- Use durations over 0.5s (feels sluggish)
- Animate everything (only meaningful transitions)
- Forget to handle `prefers-reduced-motion`

### Accessibility: Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Quick Reference Table

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| `enterFromRight` | 0.2s | ease-out | Side panels, drawers |
| `enterFromLeft` | 0.2s | ease-out | Sidebars, back nav |
| `scaleIn` | 0.2s | ease-out | Modals, dropdowns |
| `exitToRight` | 0.15s | ease-in | Dismiss panels |
| `exitToLeft` | 0.15s | ease-in | Collapse sidebars |
| `scaleOut` | 0.15s | ease-in | Close modals |
| `fade-in` | 0.3s | ease-out | Page loads |
| `slide-up` | 0.4s | ease-out | Card reveals |
| `scale-in` | 0.2s | ease-out | Button pops |
| `spin` | 1s | linear | Loaders |

---

*This document is part of the Nixelo Design System. See [MASTER_PLAN.md](../MASTER_PLAN.md) for the full design system overview.*
