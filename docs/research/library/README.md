# Omega Comparison Library

A comprehensive visual and technical reference of competitor sites, captured via automated browser agents.

## 1. Linear (Best-in-Class UI/UX)

| Page         | Visual                      | Tech Stack                        |
| ------------ | --------------------------- | --------------------------------- |
| **Home**     | [View](linear/home.png)     | [View](linear/home_tech.json)     |
| **Features** | [View](linear/features.png) | [View](linear/features_tech.json) |
| **Docs**     | [View](linear/docs.png)     | [View](linear/docs_tech.json)     |

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
