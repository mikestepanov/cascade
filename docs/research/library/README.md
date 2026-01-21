# Omega Comparison Library

A comprehensive visual and technical reference of competitor sites, captured via automated browser agents.

## Quick Start

```bash
# Capture a single page
pnpm run mirror https://linear.app/features linear features

# Capture all defined targets (10 pages)
pnpm run mirror:batch
```

**Output:** Each page generates `<page>.html`, `<page>_deep.json`, and shared `assets/`.

## 1. Linear (Best-in-Class UI/UX)

| Page         | Visual                      | Tech Stack                        |
| ------------ | --------------------------- | --------------------------------- |
| **Home**     | [View](linear/home.png)     | [View](linear/home_tech.json)     |
| **Features** | [View](linear/features.png) | [View](linear/features_tech.json) |
| **Docs**     | [View](linear/docs.png)     | [View](linear/docs_tech.json)     |

**V2 Max-Fidelity Capture (Home):**

| Device     | Visual                          |
| ---------- | ------------------------------- |
| 🖥️ Desktop | [View](linear/home_desktop.png) |
| 📱 Tablet  | [View](linear/home_tablet.png)  |
| 📲 Mobile  | [View](linear/home_mobile.png)  |

| Data Type | File                                    | Size   |
| --------- | --------------------------------------- | ------ |
| Full DOM  | [home.html](linear/home.html)           | 2.5 MB |
| Deep Data | [home_deep.json](linear/home_deep.json) | 50 KB  |

**Key Findings:**

- **Stack:** Next.js + React.
- **State:** MobX (Global state management detected).
- **Styling:** Custom Theme System + Styled Components.
- **Key Asset:** `Inter Variable` font.

## 2. ClickUp (Feature Density)

| Page        | Visual                      | Tech Stack                        |
| ----------- | --------------------------- | --------------------------------- |
| **Home**    | [View](clickup/home.png)    | [View](clickup/home_tech.json)    |
| **Pricing** | [View](clickup/pricing.png) | [View](clickup/pricing_tech.json) |

**Key Findings:**

- **Stack:** Next.js.
- **Complexity:** Extremely high DOM density (3000+ nodes on home).
- **Tables:** Custom grid implementation mixed with standard tables.

## 3. Notion (Editor & Content)

| Page        | Visual                     | Tech Stack                       |
| ----------- | -------------------------- | -------------------------------- |
| **Product** | [View](notion/product.png) | [View](notion/product_tech.json) |

**Key Findings:**

- **Stack:** Next.js + React.
- **Structure:** "Block" based CSS classes everywhere, confirming their block-model architecture.
- **CSS:** Heavy use of CSS Modules (hashed classes).
