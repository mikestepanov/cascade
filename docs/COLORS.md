# Cascade Color System

> **Last Updated:** 2025-11-20
> **Version:** 2.0.0 - Semantic Color Tokens

Complete guide to Cascade's semantic color system for consistent theming and easy brand changes.

---

## 🎨 Design Philosophy

Our color system uses **semantic tokens** instead of hardcoded colors. This means:
- **Easy rebranding**: Change the entire app's colors in one place
- **Consistent dark mode**: Automatic dark mode variants
- **Clear intent**: Color names describe their purpose, not their appearance
- **Type-safe**: Works with TypeScript and Tailwind IntelliSense

---

## 📋 Quick Reference

### Brand Colors (Primary Actions)

Use for primary buttons, links, and key interactive elements.

```tsx
// ✅ DO: Use semantic brand colors
<button className="bg-brand-600 hover:bg-brand-700 text-white">
  Primary Action
</button>

// ❌ DON'T: Use hardcoded blue
<button className="bg-blue-600 hover:bg-blue-700 text-white">
  Primary Action
</button>
```

**Available shades:**
- `brand-50` to `brand-950` (11 shades total)
- `brand-600` is the default brand color

---

### Accent Colors (Secondary Actions)

Use for secondary buttons, highlights, and accent elements.

```tsx
<button className="bg-accent-600 hover:bg-accent-700 text-white">
  Secondary Action
</button>
```

**Available shades:**
- `accent-50` to `accent-950` (11 shades total)
- `accent-600` is the default accent color

---

### UI Background Colors

Use for backgrounds, cards, and surfaces.

```tsx
// Light mode automatically uses correct colors
<div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
  Primary background (white in light, dark gray in dark mode)
</div>

<div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
  Secondary background (light gray in light, darker gray in dark mode)
</div>

<div className="bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark">
  Tertiary background (lightest gray)
</div>
```

**Available tokens:**
- `ui-bg-primary` / `ui-bg-primary-dark` - Main background
- `ui-bg-secondary` / `ui-bg-secondary-dark` - Secondary surfaces
- `ui-bg-tertiary` / `ui-bg-tertiary-dark` - Subtle backgrounds
- `ui-bg-elevated` / `ui-bg-elevated-dark` - Modal/dropdown backgrounds
- `ui-bg-overlay` / `ui-bg-overlay-dark` - Modal overlays

---

### UI Text Colors

Use for all text content.

```tsx
<h1 className="text-ui-text-primary dark:text-ui-text-primary-dark">
  Primary heading
</h1>

<p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
  Secondary text (less emphasis)
</p>

<span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
  Tertiary text (lowest emphasis)
</span>
```

**Available tokens:**
- `ui-text-primary` / `ui-text-primary-dark` - Primary text
- `ui-text-secondary` / `ui-text-secondary-dark` - Secondary text
- `ui-text-tertiary` / `ui-text-tertiary-dark` - Tertiary text
- `ui-text-inverse` / `ui-text-inverse-dark` - Text on dark backgrounds

---

### UI Border Colors

Use for borders, dividers, and outlines.

```tsx
<input className="border border-ui-border-primary dark:border-ui-border-primary-dark focus:border-ui-border-focus dark:focus:border-ui-border-focus-dark" />
```

**Available tokens:**
- `ui-border-primary` / `ui-border-primary-dark` - Default borders
- `ui-border-secondary` / `ui-border-secondary-dark` - Subtle borders
- `ui-border-focus` / `ui-border-focus-dark` - Focus states
- `ui-border-error` / `ui-border-error-dark` - Error states

---

### Status Colors

Use for success, warning, error, and info messages.

```tsx
// Success message
<div className="bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark">
  ✓ Changes saved successfully
</div>

// Error message
<div className="bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark">
  ✗ Something went wrong
</div>

// Warning message
<div className="bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark">
  ⚠ Please review this
</div>

// Info message
<div className="bg-status-info-bg dark:bg-status-info-bg-dark text-status-info-text dark:text-status-info-text-dark">
  ℹ Additional information
</div>
```

**Status types:**
- `status-success-*` - Green for success states
- `status-warning-*` - Orange/yellow for warnings
- `status-error-*` - Red for errors
- `status-info-*` - Blue for informational messages

Each status has:
- `DEFAULT` - Main color (for icons, badges)
- `bg` - Background color for light mode
- `text` - Text color for light mode
- `bg-dark` - Background color for dark mode
- `text-dark` - Text color for dark mode

---

### Priority Colors (Issue Management)

Use for issue priority badges and indicators.

```tsx
<span className="text-priority-highest">Highest Priority</span>
<span className="text-priority-high">High Priority</span>
<span className="text-priority-medium">Medium Priority</span>
<span className="text-priority-low">Low Priority</span>
<span className="text-priority-lowest">Lowest Priority</span>
```

**Available tokens:**
- `priority-highest` - Red
- `priority-high` - Orange
- `priority-medium` - Yellow
- `priority-low` - Blue
- `priority-lowest` - Gray

---

### Issue Type Colors

Use for issue type badges and indicators.

```tsx
<span className="text-issue-type-bug">Bug</span>
<span className="text-issue-type-task">Task</span>
<span className="text-issue-type-story">Story</span>
<span className="text-issue-type-epic">Epic</span>
<span className="text-issue-type-subtask">Subtask</span>
```

**Available tokens:**
- `issue-type-bug` - Red
- `issue-type-task` - Blue
- `issue-type-story` - Purple
- `issue-type-epic` - Orange
- `issue-type-subtask` - Gray

---

## 🔄 Migration Guide

### Converting Existing Components

**Before:**
```tsx
<div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
  <h2 className="text-gray-900 dark:text-gray-100">Title</h2>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
  <button className="bg-blue-600 hover:bg-blue-700 text-white">
    Click Me
  </button>
</div>
```

**After:**
```tsx
<div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark">
  <h2 className="text-ui-text-primary dark:text-ui-text-primary-dark">Title</h2>
  <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">Description</p>
  <button className="bg-brand-600 hover:bg-brand-700 text-white">
    Click Me
  </button>
</div>
```

### Color Mapping Reference

| Old (Hardcoded) | New (Semantic) | Purpose |
|-----------------|----------------|---------|
| `bg-white` | `bg-ui-bg-primary` | Primary backgrounds |
| `bg-gray-50/100` | `bg-ui-bg-secondary` | Secondary backgrounds |
| `bg-gray-900` (dark) | `bg-ui-bg-primary-dark` | Dark mode backgrounds |
| `text-gray-900` | `text-ui-text-primary` | Primary text |
| `text-gray-600` | `text-ui-text-secondary` | Secondary text |
| `text-gray-400` | `text-ui-text-tertiary` | Tertiary text |
| `border-gray-300` | `border-ui-border-primary` | Borders |
| `bg-blue-600` | `bg-brand-600` | Primary buttons |
| `bg-purple-600` | `bg-accent-600` | Secondary buttons |
| `bg-green-100` | `bg-status-success-bg` | Success backgrounds |
| `bg-red-100` | `bg-status-error-bg` | Error backgrounds |

---

## 🎯 Best Practices

### 1. Use Semantic Names

```tsx
// ✅ Good: Semantic intent is clear
<button className="bg-brand-600 hover:bg-brand-700">Primary</button>
<button className="bg-accent-600 hover:bg-accent-700">Secondary</button>

// ❌ Bad: Color is hardcoded
<button className="bg-blue-600 hover:bg-blue-700">Primary</button>
<button className="bg-purple-600 hover:bg-purple-700">Secondary</button>
```

### 2. Always Include Dark Mode

```tsx
// ✅ Good: Dark mode specified
<div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark">

// ❌ Bad: No dark mode variant
<div className="bg-ui-bg-primary">
```

### 3. Use Status Colors for Feedback

```tsx
// ✅ Good: Status color with proper background and text
<div className="bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark">
  Error message
</div>

// ❌ Bad: Arbitrary red color
<div className="bg-red-100 text-red-800">
  Error message
</div>
```

### 4. Leverage the Full Scale

```tsx
// Use lighter shades for hover states
<button className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800">

// Use lighter shades for backgrounds
<div className="bg-brand-50 dark:bg-brand-950">

// Use darker shades for text on light backgrounds
<span className="text-brand-700">
```

---

## 🔧 Changing the Brand Color

To rebrand the entire application:

1. **Edit `tailwind.config.js`:**

```js
brand: {
  50: '#F0FDF4',   // Light green
  100: '#DCFCE7',
  200: '#BBF7D0',
  300: '#86EFAC',
  400: '#4ADE80',
  500: '#22C55E',   // Main brand color
  600: '#16A34A',   // DEFAULT
  700: '#15803D',
  800: '#166534',
  900: '#14532D',
  950: '#052E16',
},
```

2. **Save and rebuild:**

```bash
# The app will automatically use the new colors
pnpm run dev
```

That's it! All 211+ blue references will now use your new brand color.

---

## 📊 Color Usage Statistics

As of 2025-11-20:
- **Hardcoded blue**: 211 references (to be migrated)
- **Hardcoded gray**: 1,338 references (to be migrated)
- **Semantic tokens**: All new components should use these

---

## 🚀 Migration Priority

### Phase 1: Core Components (High Priority)
- ✅ Button component
- ✅ Form components (Input, Select, Textarea, Checkbox)
- ⏳ SignInForm
- ⏳ Settings pages
- ⏳ Dashboard

### Phase 2: Feature Components (Medium Priority)
- ⏳ Project boards
- ⏳ Issue cards
- ⏳ Document editor
- ⏳ Modals

### Phase 3: Remaining Components (Low Priority)
- ⏳ All other components
- ⏳ Legacy styles in index.css

---

## 🎨 Color Palette Preview

### Brand (Indigo)
- 50: #EEF2FF (lightest)
- 600: #4F46E5 (default)
- 950: #1E1B4B (darkest)

### Accent (Purple)
- 50: #FAF5FF (lightest)
- 600: #9333EA (default)
- 950: #3B0764 (darkest)

### Status
- Success: #10B981 (green)
- Warning: #F59E0B (orange)
- Error: #EF4444 (red)
- Info: #3B82F6 (blue)

---

## 📚 Resources

- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Color Palette Builder](https://toolness.github.io/accessible-color-matrix/)

---

## 🤝 Contributing

When adding new components:
1. **Always use semantic color tokens**
2. **Test in both light and dark mode**
3. **Check color contrast** (WCAG AA minimum)
4. **Document any new color patterns**

---

**Need help?** Check `tailwind.config.js` for the complete color definitions.
