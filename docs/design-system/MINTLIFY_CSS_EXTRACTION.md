# Mintlify CSS Extraction

> **Purpose**: Actionable CSS patterns extracted from Mintlify for adaptation into Nixelo's design system.
> **Source**: `docs/research/library/mintlify/` - landing, pricing, docs, signup, and dashboard pages.

---

## Table of Contents

1. [CSS Variables - Complete Reference](#1-css-variables---complete-reference)
2. [Keyframe Animations](#2-keyframe-animations)
3. [Component Patterns](#3-component-patterns)
4. [Typography System](#4-typography-system)
5. [Dark/Light Mode Strategy](#5-darklight-mode-strategy)
6. [Media Queries & Breakpoints](#6-media-queries--breakpoints)
7. [Utility Classes](#7-utility-classes)
8. [Ready-to-Use Code Blocks](#8-ready-to-use-code-blocks)

---

## 1. CSS Variables - Complete Reference

### 1.1 Core Color System (Landing/Marketing)

Mintlify uses a semantic color system with clear separation between light and dark modes.

```css
:root {
  /* === BACKGROUNDS === */
  --color-background-main: #08090a;        /* Near-black, not gray */
  --color-background-invert: #fff;
  --color-background-soft: rgba(255, 255, 255, 0.05);

  /* === TEXT === */
  --color-text-main: #fff;
  --color-text-invert: #08090a;
  --color-text-soft: rgba(255, 255, 255, 0.7);   /* Secondary text */
  --color-text-sub: rgba(255, 255, 255, 0.6);    /* Tertiary text */
  --color-muted: rgba(255, 255, 255, 0.5);       /* Disabled/hint text */
  --color-muted-invert: rgba(8, 9, 10, 0.5);

  /* === BORDERS === */
  --color-border-sub: rgba(255, 255, 255, 0.07);      /* Ultra-subtle */
  --color-border-surface: rgba(255, 255, 255, 0.05);  /* Card edges */
  --color-border-soft: rgba(255, 255, 255, 0.15);     /* Visible borders */
  --color-border-solid: #fff;                          /* High contrast */

  /* === BRAND === */
  --color-brand: #18e299;          /* Vibrant mint green */
  --color-brand-light: #0c8c5e;    /* Darker variant */
}
```

### 1.2 Dashboard/App Color System

The dashboard uses a more extensive token system with RGB values for opacity manipulation:

```css
:root {
  /* === FOREGROUND (Text/Icons) === */
  --foreground-gray-default: 255 255 255;
  --foreground-gray-subtle: 168 162 158;
  --foreground-gray-muted: 120 113 108;
  --foreground-gray-disabled: 68 64 60;
  --foreground-gray-inverted: 12 10 9;

  /* === FOREGROUND STATUS (Solid) === */
  --foreground-status-solid-brand: 34 197 94;
  --foreground-status-solid-info: 147 197 253;
  --foreground-status-solid-success: 134 239 172;
  --foreground-status-solid-warning: 253 186 116;
  --foreground-status-solid-error: 252 165 165;
  --foreground-status-solid-feature: 216 180 254;

  /* === FOREGROUND STATUS (Subtle) === */
  --foreground-status-subtle-brand: 22 101 52;
  --foreground-status-subtle-info: 30 64 175;
  --foreground-status-subtle-success: 22 101 52;
  --foreground-status-subtle-warning: 154 52 18;
  --foreground-status-subtle-error: 153 27 27;
  --foreground-status-subtle-feature: 107 33 168;

  /* === BACKGROUND === */
  --background-gray-default: 12 10 9;
  --background-gray-subtle: 28 25 23;
  --background-gray-muted: 68 64 60;
  --background-gray-emphasis: 87 83 78;
  --background-gray-inverted: 250 250 249;
  --background-gray-disabled: 41 37 36;

  /* === BACKGROUND STATUS (Solid) === */
  --background-status-solid-brand: 22 163 74;
  --background-status-solid-info: 37 99 235;
  --background-status-solid-success: 22 163 74;
  --background-status-solid-warning: 234 88 12;
  --background-status-solid-error: 220 38 38;
  --background-status-solid-feature: 147 51 234;

  /* === BACKGROUND STATUS (Subtle) === */
  --background-status-subtle-brand: 5 46 22;
  --background-status-subtle-info: 23 37 84;
  --background-status-subtle-success: 5 46 22;
  --background-status-subtle-warning: 67 20 7;
  --background-status-subtle-error: 69 10 10;
  --background-status-subtle-feature: 59 7 100;

  /* === BORDER === */
  --border-gray-default: 68 64 60;
  --border-gray-muted: 41 37 36;
  --border-gray-emphasis: 87 83 78;
  --border-gray-strong: 120 113 108;
  --border-gray-disabled: 68 64 60;
  --border-gray-solid: 245 245 244;

  /* === BORDER STATUS === */
  --border-status-brand: 34 197 94;
  --border-status-info: 30 58 138;
  --border-status-success: 20 83 45;
  --border-status-warning: 124 45 18;
  --border-status-error: 127 29 29;
  --border-status-feature: 88 28 135;

  /* === BORDER ALPHA (Transparency) === */
  --border-alpha-5: #ffffff0d;
  --border-alpha-8: #ffffff14;
  --border-alpha-10: #ffffff1a;
  --border-alpha-20: #fff3;
  --border-alpha-25: #ffffff40;
  --border-alpha-solid: #ffffff40;

  /* === COMPONENT-SPECIFIC === */
  --component-sidebar-bg: 28 25 23;
}
```

### 1.3 Typography Variables

```css
:root {
  /* === FONT FAMILIES === */
  --font-inter: "inter", "inter Fallback";
  --font-geist-mono: "Geist Mono", "Geist Mono Fallback";
  --font-jetbrains-mono: "JetBrains Mono", "JetBrains Mono Fallback";

  /* === TAILWIND TYPOGRAPHY === */
  --tw-font-weight: var(--font-weight-medium);
  --tw-tracking: -0.24px;  /* Tight letter-spacing for headings */
  --tw-duration: 0.2s;      /* Standard transition duration */
}
```

### 1.4 Shadows & Effects

```css
:root {
  /* === SHADOWS === */
  --shadow-xs: 0px 1px 2px 0px #fff0;
  --shadow-tooltip-sm: 0px 10px 16px -3px #14151a0d, 0px 3px 10px -2px #14151a05;
  --twoslash-popup-shadow: rgba(0, 0, 0, 0.08) 0px 1px 4px;
  --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);

  /* === FOCUS RINGS === */
  --focus-light: 0px 0px 0px 2px #ffffff24;
  --focus-accent: 0px 0px 0px 2px #26bd6c;
  --focus-light-destructive: 0px 0px 0px 2px #ffb2b299;
}
```

### 1.5 Documentation/Code Block Variables

```css
:root {
  /* === TWOSLASH (Code Highlighting) === */
  --twoslash-border-color: #222526;
  --twoslash-underline-color: currentColor;
  --twoslash-popup-bg: #151819;
  --twoslash-popup-color: inherit;
  --twoslash-code-font: inherit;
  --twoslash-code-font-size: 1em;
  --twoslash-matched-color: inherit;
  --twoslash-unmatched-color: #aaa;
  --twoslash-cursor-color: rgba(187, 187, 187, 0.733);
  --twoslash-text-size: 0.8rem;

  /* === TWOSLASH HIGHLIGHTS === */
  --twoslash-highlighted-border: rgba(255, 165, 0, 0.5);
  --twoslash-highlighted-bg: rgba(255, 165, 0, 0.19);

  /* === TWOSLASH ERRORS/WARNINGS === */
  --twoslash-error-color: #ff6b6b;
  --twoslash-error-bg: rgba(255, 107, 107, 0.19);
  --twoslash-warn-color: orange;
  --twoslash-warn-bg: rgba(255, 165, 0, 0.19);

  /* === TWOSLASH TAGS === */
  --twoslash-tag-color: #6bb6ff;
  --twoslash-tag-bg: rgba(107, 182, 255, 0.19);
  --twoslash-tag-annotate-color: #4ade80;
  --twoslash-tag-annotate-bg: rgba(74, 222, 128, 0.19);

  /* === JSON HIGHLIGHTING === */
  --json-property: #3a9685;
  --json-index: #ae408b;
  --json-number: #ae408b;
  --json-string: #8123a9;
  --json-boolean: #0184bc;
  --json-null: #0184bc;
}
```

### 1.6 Prose/Content Variables

```css
:root {
  /* === PROSE COLORS === */
  --tw-prose-body: var(--color-text-main);
  --tw-prose-headings: var(--color-text-main);
  --tw-prose-bold: var(--color-text-main);
  --tw-prose-links: var(--color-text-main);
  --tw-prose-invert-links: var(--color-brand);

  /* === PROSE INVERT (Dark Mode) === */
  --tw-prose-invert-body: #d1d5db;
  --tw-prose-invert-headings: #fff;
  --tw-prose-invert-lead: #9ca3af;
  --tw-prose-invert-links: #fff;
  --tw-prose-invert-bold: #fff;
  --tw-prose-invert-counters: #9ca3af;
  --tw-prose-invert-bullets: #4b5563;
  --tw-prose-invert-hr: #374151;
  --tw-prose-invert-quotes: #f3f4f6;
  --tw-prose-invert-quote-borders: #374151;
  --tw-prose-invert-captions: #9ca3af;
  --tw-prose-invert-kbd: #fff;
  --tw-prose-invert-code: #fff;
  --tw-prose-invert-pre-code: #d1d5db;
  --tw-prose-invert-pre-bg: rgb(0 0 0 / 50%);
  --tw-prose-invert-th-borders: #4b5563;
  --tw-prose-invert-td-borders: #374151;
}
```

### 1.7 Gray Scale (Docs Theme)

```css
:root {
  --gray-50: 243 246 244;
  --gray-100: 238 241 239;
  --gray-200: 223 225 224;
  --gray-300: 206 209 207;
  --gray-400: 159 161 160;
  --gray-500: 112 115 113;
  --gray-600: 80 83 81;
  --gray-700: 63 65 64;
  --gray-800: 38 40 39;
  --gray-900: 23 26 24;
  --gray-950: 10 13 12;
}
```

---

## 2. Keyframe Animations

### 2.1 Entry/Exit Animations

```css
/* Slide in from right */
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

/* Slide in from left */
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

/* Slide out to right */
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

/* Slide out to left */
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

### 2.2 Scale Animations (Modals/Popovers)

```css
/* Scale in with subtle rotation - great for modals */
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

/* Scale out with subtle rotation */
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

### 2.3 Generic Enter/Exit (Tailwind-compatible)

```css
/* Configurable enter animation */
@keyframes enter {
  0% {
    opacity: var(--tw-enter-opacity, 1);
    transform: translate3d(
        var(--tw-enter-translate-x, 0),
        var(--tw-enter-translate-y, 0),
        0
      )
      scale3d(
        var(--tw-enter-scale, 1),
        var(--tw-enter-scale, 1),
        var(--tw-enter-scale, 1)
      )
      rotate(var(--tw-enter-rotate, 0));
  }
}

/* Configurable exit animation */
@keyframes exit {
  100% {
    opacity: var(--tw-exit-opacity, 1);
    transform: translate3d(
        var(--tw-exit-translate-x, 0),
        var(--tw-exit-translate-y, 0),
        0
      )
      scale3d(
        var(--tw-exit-scale, 1),
        var(--tw-exit-scale, 1),
        var(--tw-exit-scale, 1)
      )
      rotate(var(--tw-exit-rotate, 0));
  }
}
```

### 2.4 Utility Animations

```css
/* Simple fade in */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* Slide up (for toasts, bottom sheets) */
@keyframes slide-up {
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
}

/* Pulse (for loading states) */
@keyframes pulse {
  50% { opacity: 0.5; }
}

/* Shimmer (for skeleton loaders) */
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Spin (for loaders) */
@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Alternative spin */
@keyframes loader-spin {
  100% { transform: rotate(1turn); }
}
```

### 2.5 Focus Ring Animation

```css
/* Expanding focus ring */
@keyframes gm3-focus-ring-outward-grows {
  0% {
    box-shadow: 0 0 0 0 var(--focus-ring-color, #00639b);
  }
  100% {
    box-shadow: 0 0 0 8px var(--focus-ring-color, #00639b);
  }
}

/* Contracting focus ring */
@keyframes gm3-focus-ring-outward-shrinks {
  0% {
    box-shadow: 0 0 0 8px var(--focus-ring-color, #00639b);
  }
}
```

### 2.6 Ripple Effect (Material-inspired)

```css
@keyframes mdc-ripple-fg-radius-in {
  0% {
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transform: translate(var(--mdc-ripple-fg-translate-start, 0)) scale(1);
  }
  100% {
    transform: translate(var(--mdc-ripple-fg-translate-end, 0))
      scale(var(--mdc-ripple-fg-scale, 1));
  }
}

@keyframes mdc-ripple-fg-opacity-in {
  0% {
    animation-timing-function: linear;
    opacity: 0;
  }
  100% {
    opacity: var(--mdc-ripple-fg-opacity, 0);
  }
}

@keyframes mdc-ripple-fg-opacity-out {
  0% {
    animation-timing-function: linear;
    opacity: var(--mdc-ripple-fg-opacity, 0);
  }
  100% {
    opacity: 0;
  }
}
```

---

## 3. Component Patterns

### 3.1 Input Styles

```css
/* Base input structure */
.input-base {
  --tw-bg-opacity: 1;
  background-color: rgb(var(--foreground-gray-inverted) / var(--tw-bg-opacity));
}

/* Size variants */
.input-medium {
  border-radius: 12px;
  max-height: 40px;
  padding: 10px 12px;
}

.input-xsmall {
  border-radius: 10px;
  max-height: 32px;
  padding: 6px 8px;
}

/* Default state */
.input-default {
  outline: 2px solid rgb(var(--border-gray-default) / 1);
  outline-offset: -1px;
}

.input-default:focus-within {
  outline-color: rgb(var(--border-gray-strong) / 1);
}

/* Destructive/error state */
.input-destructive {
  outline: 1px solid rgb(var(--foreground-status-solid-error) / 1);
  outline-offset: -1px;
}

.input-destructive:focus-within {
  outline-color: rgb(var(--foreground-status-solid-error) / 1);
  box-shadow: var(--focus-light-destructive);
}

/* Input text */
.input-input {
  all: unset;
  height: 100%;
  max-height: 100%;
  color: rgb(var(--foreground-gray-default));
  background-color: rgb(var(--foreground-gray-inverted)) !important;
  padding: 0 4px !important;
}

.input-input::placeholder {
  color: rgb(var(--foreground-gray-muted));
}

.input-input:focus {
  box-shadow: none !important;
  outline: none !important;
}

/* Input icon */
.input-icon {
  color: rgb(var(--foreground-gray-muted));
}

.input-icon.disabled {
  color: rgb(var(--foreground-gray-disabled));
}
```

### 3.2 HubSpot Form Wrapper (Form Pattern)

A comprehensive form styling pattern:

```css
.form-wrapper {
  width: 100%;
}

.form-wrapper .form-field > label {
  color: var(--color-text-main);
  padding-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  display: block;
}

.form-wrapper .form-input {
  border: 1px solid var(--color-border-sub);
  color: var(--color-text-main);
  font: inherit;
  background: transparent;
  border-radius: 0.75rem;
  padding: 0.625rem 1rem;
  width: 100%;
}

.form-wrapper .form-input:hover {
  border-color: var(--color-border-soft);
  background: var(--color-background-soft);
}

.form-wrapper .form-input:focus {
  outline: 1px solid var(--color-brand);
  border-color: var(--color-brand);
}

.form-wrapper .form-input::placeholder {
  color: var(--color-text-sub);
}

.form-wrapper .form-button {
  background: var(--color-text-main);
  width: 100%;
  color: var(--color-text-invert);
  cursor: pointer;
  border: none;
  border-radius: 9999px;
  padding: 0.625rem 1.25rem;
  font: 500 0.875rem/150% inherit;
}

.form-wrapper .form-button:hover {
  opacity: 0.9;
}

.form-wrapper .form-error {
  color: #ef4444;
  margin: 0.25rem 0 0;
  padding: 0;
  font-size: 0.875rem;
  list-style: none;
}
```

### 3.3 Button Patterns (Google Material 3 inspired)

```css
/* Base button */
.button-base {
  --gm3-button-container-height: auto;
  --gm3-button-label-text-weight: 500;
  --gm3-button-container-shape: 20px;
}

/* Filled button */
.button-filled {
  --gm3-button-filled-container-shape-start-start: 20px;
  --gm3-button-filled-container-shape-start-end: 20px;
  --gm3-button-filled-container-shape-end-end: 20px;
  --gm3-button-filled-container-shape-end-start: 20px;
}

/* Tonal button */
.button-tonal {
  --gm3-button-filled-tonal-leading-space: 16px;
  --gm3-button-filled-tonal-trailing-space: 16px;
}

/* Text button */
.button-text {
  --gm3-button-text-leading-space: 16px;
  --gm3-button-text-trailing-space: 16px;
}

/* Text button hover states */
.button-text:hover {
  --gm3-button-text-hover-state-layer-opacity: 0.08;
}

.button-text:active {
  --gm3-button-text-pressed-state-layer-opacity: 0.1;
}
```

### 3.4 Card/Panel Styles

```css
/* Pricing comparison table */
.pricing-table {
  z-index: 3;
  background-color: var(--color-background-main);
  position: sticky;
  top: 65.5px;
}

/* Header fade effect */
.pricing-header-fade {
  --fade-height: 20px;
}

.pricing-header-fade::after {
  content: "";
  height: var(--fade-height);
  width: 100%;
  bottom: calc(var(--fade-height) * -1);
  pointer-events: none;
  background: linear-gradient(
    180deg,
    var(--color-background-main) 0,
    transparent 100%
  );
  display: block;
  position: absolute;
}

/* Header cell */
.header-cell {
  grid-row: 1 / -1;
  display: grid;
  grid-template-rows: subgrid;
  place-items: center;
  gap: 16px;
  padding: 16px 20px 0;
  position: relative;
}
```

### 3.5 Hero Background Pattern

```css
.bg-image-hero {
  z-index: -1;
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
  width: 100%;
  height: 100%;
  position: absolute;
  top: -10rem;
  /* Gradient mask for fade-out effect */
  mask-image: linear-gradient(
    #000 0%,
    rgba(0, 0, 0, 0.99) 18.5%,
    rgba(0, 0, 0, 0.953) 34.3%,
    rgba(0, 0, 0, 0.894) 47.6%,
    rgba(0, 0, 0, 0.824) 58.5%,
    rgba(0, 0, 0, 0.74) 67.5%,
    rgba(0, 0, 0, 0.647) 74.7%,
    rgba(0, 0, 0, 0.55) 80.3%,
    rgba(0, 0, 0, 0.45) 84.7%,
    rgba(0, 0, 0, 0.353) 88%,
    rgba(0, 0, 0, 0.26) 90.5%,
    rgba(0, 0, 0, 0.176) 92.5%,
    rgba(0, 0, 0, 0.106) 94.2%,
    rgba(0, 0, 0, 0.047) 95.9%,
    rgba(0, 0, 0, 0.01) 97.7%,
    transparent 100%
  );
}

@media (max-width: 768px) {
  .bg-image-hero {
    top: -5rem;
  }
}

/* Light/dark variants */
.bg-image-hero {
  background-image: url(/hero/bg-light.svg);
}

.dark .bg-image-hero {
  background-image: url(/hero/bg-dark.svg);
}
```

---

## 4. Typography System

### 4.1 Complete Typography Scale

```css
/* Display (96px) */
.typography-display-light { letter-spacing: -3.6px; font-size: 96px; font-weight: 300; line-height: 100px; }
.typography-display-regular { letter-spacing: -3.6px; font-size: 96px; font-weight: 400; line-height: 100px; }
.typography-display-medium { letter-spacing: -3.6px; font-size: 96px; font-weight: 500; line-height: 100px; }
.typography-display-semibold { letter-spacing: -3.6px; font-size: 96px; font-weight: 600; line-height: 100px; }
.typography-display-bold { letter-spacing: -3.6px; font-size: 96px; font-weight: 700; line-height: 100px; }

/* H1 (72px) */
.typography-h1-light { letter-spacing: -2.2px; font-size: 72px; font-weight: 300; line-height: 80px; }
.typography-h1-regular { letter-spacing: -2.2px; font-size: 72px; font-weight: 400; line-height: 80px; }
.typography-h1-medium { letter-spacing: -2.2px; font-size: 72px; font-weight: 500; line-height: 80px; }
.typography-h1-semibold { letter-spacing: -2.2px; font-size: 72px; font-weight: 600; line-height: 80px; }
.typography-h1-bold { letter-spacing: -2.2px; font-size: 72px; font-weight: 700; line-height: 80px; }

/* H2 (64px) */
.typography-h2-light { letter-spacing: -1.7px; font-size: 64px; font-weight: 300; line-height: 72px; }
.typography-h2-regular { letter-spacing: -1.7px; font-size: 64px; font-weight: 400; line-height: 72px; }
.typography-h2-medium { letter-spacing: -1.7px; font-size: 64px; font-weight: 500; line-height: 72px; }
.typography-h2-semibold { letter-spacing: -1.7px; font-size: 64px; font-weight: 600; line-height: 72px; }
.typography-h2-bold { letter-spacing: -1.7px; font-size: 64px; font-weight: 700; line-height: 72px; }

/* H3 (48px) */
.typography-h3-light { letter-spacing: -1px; font-size: 48px; font-weight: 300; line-height: 56px; }
.typography-h3-regular { letter-spacing: -1px; font-size: 48px; font-weight: 400; line-height: 56px; }
.typography-h3-medium { letter-spacing: -1px; font-size: 48px; font-weight: 500; line-height: 56px; }
.typography-h3-semibold { letter-spacing: -1px; font-size: 48px; font-weight: 600; line-height: 56px; }
.typography-h3-bold { letter-spacing: -1px; font-size: 48px; font-weight: 700; line-height: 56px; }

/* H4 (36px) */
.typography-h4-light { letter-spacing: -0.7px; font-size: 36px; font-weight: 300; line-height: 44px; }
.typography-h4-regular { letter-spacing: -0.7px; font-size: 36px; font-weight: 400; line-height: 44px; }
.typography-h4-medium { letter-spacing: -0.7px; font-size: 36px; font-weight: 500; line-height: 44px; }
.typography-h4-semibold { letter-spacing: -0.7px; font-size: 36px; font-weight: 600; line-height: 44px; }
.typography-h4-bold { letter-spacing: -0.7px; font-size: 36px; font-weight: 700; line-height: 44px; }

/* H5 (30px) */
.typography-h5-light { letter-spacing: -0.5px; font-size: 30px; font-weight: 300; line-height: 36px; }
.typography-h5-regular { letter-spacing: -0.5px; font-size: 30px; font-weight: 400; line-height: 36px; }
.typography-h5-medium { letter-spacing: -0.5px; font-size: 30px; font-weight: 500; line-height: 36px; }
.typography-h5-semibold { letter-spacing: -0.5px; font-size: 30px; font-weight: 600; line-height: 36px; }
.typography-h5-bold { letter-spacing: -0.5px; font-size: 30px; font-weight: 700; line-height: 36px; }

/* H6 (24px) */
.typography-h6-light { letter-spacing: -0.3px; font-size: 24px; font-weight: 300; line-height: 32px; }
.typography-h6-regular { letter-spacing: -0.3px; font-size: 24px; font-weight: 400; line-height: 32px; }
.typography-h6-medium { letter-spacing: -0.3px; font-size: 24px; font-weight: 500; line-height: 32px; }
.typography-h6-semibold { letter-spacing: -0.3px; font-size: 24px; font-weight: 600; line-height: 32px; }
.typography-h6-bold { letter-spacing: -0.3px; font-size: 24px; font-weight: 700; line-height: 32px; }

/* Body Large (20px) */
.typography-body-l-regular { letter-spacing: -0.2px; font-size: 20px; font-weight: 400; line-height: 28px; }
.typography-body-l-medium { letter-spacing: -0.2px; font-size: 20px; font-weight: 500; line-height: 28px; }
.typography-body-l-semibold { letter-spacing: -0.2px; font-size: 20px; font-weight: 600; line-height: 28px; }

/* Body Medium (18px) */
.typography-body-m-regular { letter-spacing: -0.2px; font-size: 18px; font-weight: 400; line-height: 26px; }
.typography-body-m-medium { letter-spacing: -0.2px; font-size: 18px; font-weight: 500; line-height: 26px; }
.typography-body-m-semibold { letter-spacing: -0.2px; font-size: 18px; font-weight: 600; line-height: 26px; }

/* Body Small (16px) */
.typography-body-s-regular { letter-spacing: -0.2px; font-size: 16px; font-weight: 400; line-height: 24px; }
.typography-body-s-medium { letter-spacing: -0.2px; font-size: 16px; font-weight: 500; line-height: 24px; }
.typography-body-s-semibold { letter-spacing: -0.2px; font-size: 16px; font-weight: 600; line-height: 24px; }

/* Caption Large (14px) */
.typography-caption-l-regular { letter-spacing: -0.1px; font-size: 14px; font-weight: 400; line-height: 20px; }
.typography-caption-l-medium { letter-spacing: -0.1px; font-size: 14px; font-weight: 500; line-height: 20px; }
.typography-caption-l-semibold { letter-spacing: -0.1px; font-size: 14px; font-weight: 600; line-height: 20px; }

/* Caption Medium (12px) */
.typography-caption-m-regular { letter-spacing: 0; font-size: 12px; font-weight: 400; line-height: 16px; }
.typography-caption-m-medium { letter-spacing: 0; font-size: 12px; font-weight: 500; line-height: 16px; }
.typography-caption-m-semibold { letter-spacing: 0; font-size: 12px; font-weight: 600; line-height: 16px; }

/* Caption Small (10px) */
.typography-caption-s-regular { letter-spacing: 0; font-size: 10px; font-weight: 400; line-height: 14px; }
.typography-caption-s-medium { letter-spacing: 0; font-size: 10px; font-weight: 500; line-height: 14px; }
.typography-caption-s-semibold { letter-spacing: 0; font-size: 10px; font-weight: 600; line-height: 14px; }
```

### 4.2 Key Typography Insights

| Level | Size | Line Height | Letter Spacing | Ratio |
|-------|------|-------------|----------------|-------|
| Display | 96px | 100px | -3.6px | 1.04 |
| H1 | 72px | 80px | -2.2px | 1.11 |
| H2 | 64px | 72px | -1.7px | 1.125 |
| H3 | 48px | 56px | -1px | 1.17 |
| H4 | 36px | 44px | -0.7px | 1.22 |
| H5 | 30px | 36px | -0.5px | 1.2 |
| H6 | 24px | 32px | -0.3px | 1.33 |
| Body L | 20px | 28px | -0.2px | 1.4 |
| Body M | 18px | 26px | -0.2px | 1.44 |
| Body S | 16px | 24px | -0.2px | 1.5 |
| Caption L | 14px | 20px | -0.1px | 1.43 |
| Caption M | 12px | 16px | 0 | 1.33 |
| Caption S | 10px | 14px | 0 | 1.4 |

**Key insight**: Larger headings use tighter (negative) letter-spacing, which creates a more premium feel.

---

## 5. Dark/Light Mode Strategy

### 5.1 Mintlify's Approach

Mintlify uses `.dark` class on elements and `html.dark` for global dark mode:

```css
/* Light mode (default) */
.bg-image-hero {
  background-image: url(/hero/bg-light.svg);
}

/* Dark mode override */
.dark .bg-image-hero {
  background-image: url(/hero/bg-dark.svg);
}

/* Or using html.dark */
html.dark .shiki,
html.dark .shiki span {
  color: var(--shiki-dark) !important;
}

html:not(.dark) .codeblock-light pre.shiki > code {
  /* light mode styles */
}
```

### 5.2 Twoslash Dark Mode Variables

```css
:root {
  --twoslash-border-color: #dbdfde;
  --twoslash-popup-bg: #f3f7f6;
  --twoslash-highlighted-border: #c37d0d50;
  --twoslash-highlighted-bg: #c37d0d20;
  --twoslash-unmatched-color: #888;
  --twoslash-error-color: #d45656;
  --twoslash-tag-color: #3772cf;
  --twoslash-tag-annotate-color: #1ba673;
}

/* Dark mode overrides */
:root.twoslash-dark,
html.dark div.dark\:twoslash-dark,
html.dark div.twoslash-dark {
  --twoslash-border-color: #222526;
  --twoslash-popup-bg: #151819;
  --twoslash-highlighted-border: #ffa50080;
  --twoslash-highlighted-bg: #ffa50030;
  --twoslash-unmatched-color: #aaa;
  --twoslash-error-color: #ff6b6b;
  --twoslash-tag-color: #6bb6ff;
  --twoslash-tag-annotate-color: #4ade80;
}
```

### 5.3 Recommended Pattern for Nixelo

Continue using `light-dark()` in Tailwind v4 for automatic dark mode:

```css
@theme {
  /* Mintlify-inspired dark background */
  --color-ui-bg: light-dark(var(--p-white), #08090a);

  /* Ultra-subtle borders like Mintlify */
  --color-ui-border: light-dark(var(--p-gray-200), rgba(255, 255, 255, 0.07));

  /* Text hierarchy with opacity */
  --color-ui-text: light-dark(var(--p-gray-900), #fff);
  --color-ui-text-secondary: light-dark(var(--p-gray-500), rgba(255, 255, 255, 0.7));
  --color-ui-text-tertiary: light-dark(var(--p-gray-400), rgba(255, 255, 255, 0.5));
}
```

---

## 6. Media Queries & Breakpoints

### 6.1 Observed Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  .bg-image-hero {
    top: -5rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .twoslash * {
    transition: none !important;
  }
}
```

### 6.2 Responsive Typography Pattern

Based on the responsive variables found:

```css
:root {
  --wf-tfs: calc(var(--c-tfs) / 16 * 1rem);
  --wf-tfs-bp2: calc(var(--c-tfs, 36) / 16 * 1rem);
  --wf-tfs-bp3: calc(var(--c-tfs, 36) / 16 * 1rem);
  --wf-tfs-bp5: calc(var(--c-tfs, 44) / 16 * 1rem);
}
```

---

## 7. Utility Classes

### 7.1 Scrollbar Styling

```css
:root {
  --scrollbar-track: transparent;
  --scrollbar-thumb: rgb(255 255 255 / 0.2);
  --scrollbar-thumb-radius: var(--rounded, 0.25rem);
  --scrollbar-thumb-hover: rgb(255 255 255 / 0.25);
  --scrollbar-thumb-active: rgb(255 255 255 / 0.25);
}
```

### 7.2 Code Block Patterns

```css
/* Inline code */
:not(pre) > code {
  overflow-wrap: break-word;
  border-radius: var(--rounded-md, 0.375rem);
  background-color: rgb(var(--gray-100) / 0.5);
  box-decoration-break: clone;
  padding: 0.125rem 0.5rem;
  line-height: 1.5;
  color: rgb(var(--gray-600));
  word-break: break-word;
}

:not(pre) > code:is(.dark *) {
  border-color: rgb(var(--gray-800));
  background-color: rgb(255 255 255 / 0.05);
  color: rgb(var(--gray-200));
}

/* Code block line highlighting */
.line-highlight {
  background: rgb(var(--primary-light) / 0.2) !important;
  width: 100%;
  display: inline-block;
  position: relative;
  z-index: 0;
}

.line-highlight::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -1rem;
  width: 1rem;
  background: rgb(var(--primary-light) / 0.2) !important;
  border-left: 1px solid rgb(var(--primary-light) / 1);
}

/* Diff lines */
.line-diff.line-add {
  background: rgb(34 197 94 / 0.15) !important;
}

.line-diff.line-add::before {
  content: "+";
  background: rgb(34 197 94 / 0.15) !important;
  border-left: 1px solid rgb(34 197 94 / 0.8);
  color: rgb(34 197 94);
}

.line-diff.line-remove {
  background: rgb(239 68 68 / 0.15) !important;
}

.line-diff.line-remove::before {
  content: "-";
  background: rgb(239 68 68 / 0.15) !important;
  border-left: 1px solid rgb(239 68 68 / 0.8);
  color: rgb(239 68 68);
}
```

### 7.3 Focused Line Blur Effect

```css
/* When code block has focused lines, blur others */
.has-focused pre.shiki > code .line {
  filter: blur(0.1rem);
  transition: filter 0.35s, opacity 0.35s;
}

.has-focused pre.shiki:hover > code .line,
.has-focused pre.shiki > code .line-focus,
.has-focused pre.shiki > code .line:hover {
  filter: blur(0);
}
```

---

## 8. Ready-to-Use Code Blocks

### 8.1 Nixelo Theme Enhancement (Add to `src/index.css`)

```css
@theme {
  /* ============================================================
   * MINTLIFY-INSPIRED ENHANCEMENTS
   * ============================================================ */

  /* --- Darker Dark Mode Background --- */
  --color-ui-bg: light-dark(var(--p-white), #08090a);

  /* --- Ultra-subtle Borders (nearly invisible) --- */
  --color-ui-border: light-dark(var(--p-gray-200), rgba(255, 255, 255, 0.07));
  --color-ui-border-secondary: light-dark(var(--p-gray-300), rgba(255, 255, 255, 0.15));

  /* --- Text Hierarchy with Opacity --- */
  --color-ui-text-secondary: light-dark(var(--p-gray-500), rgba(255, 255, 255, 0.7));
  --color-ui-text-tertiary: light-dark(var(--p-gray-400), rgba(255, 255, 255, 0.5));

  /* --- Soft Background for Cards --- */
  --color-ui-bg-soft: light-dark(var(--p-gray-50), rgba(255, 255, 255, 0.05));

  /* --- Standard Transition Duration --- */
  --duration-fast: 0.2s;

  /* --- Tight Letter Spacing for Headings --- */
  --tracking-tight: -0.24px;
  --tracking-tighter: -0.5px;
  --tracking-tightest: -1px;
}
```

### 8.2 Animation Utilities (Add to `src/index.css`)

```css
/* Entry animations */
@keyframes enter-from-right {
  0% { opacity: 0; transform: translateX(200px); }
  100% { opacity: 1; transform: translateX(0); }
}

@keyframes enter-from-left {
  0% { opacity: 0; transform: translateX(-200px); }
  100% { opacity: 1; transform: translateX(0); }
}

@keyframes scale-in {
  0% { opacity: 0; transform: rotateX(-10deg) scale(0.96); }
  100% { opacity: 1; transform: rotateX(0deg) scale(1); }
}

@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes slide-up {
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
}

/* Animation classes */
.animate-enter-right {
  animation: enter-from-right 0.3s ease-out;
}

.animate-enter-left {
  animation: enter-from-left 0.3s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

### 8.3 Typography Classes (Add to global styles)

```css
/* Mintlify-style heading with tight tracking */
.heading-display {
  font-size: clamp(2.5rem, 5vw, 6rem);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.04;
}

.heading-1 {
  font-size: clamp(2rem, 4vw, 4.5rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.11;
}

.heading-2 {
  font-size: clamp(1.75rem, 3vw, 4rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.125;
}

.heading-3 {
  font-size: clamp(1.5rem, 2.5vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.17;
}

/* Muted text classes */
.text-soft {
  color: var(--color-ui-text-secondary);
}

.text-muted {
  color: var(--color-ui-text-tertiary);
}
```

### 8.4 Card Enhancement

```css
/* Mintlify-style subtle card */
.card-subtle {
  background: var(--color-ui-bg-soft);
  border: 1px solid var(--color-ui-border);
  border-radius: var(--radius-container);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}

.card-subtle:hover {
  border-color: var(--color-ui-border-secondary);
  box-shadow: var(--shadow-card-hover);
}
```

---

## Summary

### Key Takeaways for Nixelo

1. **Darker Dark Mode**: Use `#08090a` instead of gray for dark background
2. **Ultra-subtle Borders**: Use `rgba(255, 255, 255, 0.07)` for borders in dark mode
3. **Text Hierarchy**: Use opacity (0.7, 0.6, 0.5) for text levels, not different grays
4. **Tight Letter Spacing**: Use negative letter-spacing on headings (-0.24px to -3.6px)
5. **0.2s Transitions**: Standard duration for all hover/focus states
6. **Scale + Rotate Animations**: Use `rotateX(-10deg) scale(0.96)` for modal/popover entry
7. **RGB Variables**: Use RGB format (e.g., `255 255 255`) for opacity manipulation
8. **Gradient Masks**: Use gradient masks for hero background fade effects

### Files Modified

- `src/index.css` - Add theme enhancements
- Add animation utilities
- Add typography classes
- Update card/input components
