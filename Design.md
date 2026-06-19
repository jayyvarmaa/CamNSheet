# CamNSheet Design Specification

This document details the user interface (UI) style, visual language, design system tokens, and interactive guidelines implemented in **CamNSheet** (v2.0).

---

## 🎨 1. Palette & Color Tokens

CamNSheet utilizes a professional dark-mode zinc-and-emerald color scheme with bright highlights for semantic statuses.

| Variable Name | Hex Code / Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-dark` | `#09090b` | Absolute dark backdrop / frame |
| `--card-bg` | `rgba(24, 24, 27, 0.78)` | Semi-transparent glass overlay background (Zinc 900) |
| `--card-border` | `rgba(255, 255, 255, 0.08)` | Subtle glowing border edge |
| `--primary` | `#10b981` | Emerald green accent, brand coloring, hover states |
| `--primary-hover` | `#059669` | Hover states for primary actions |
| `--danger` | `#ef4444` | Active recording, danger states, record buttons |
| `--danger-hover` | `#dc2626` | Recording button active hover states |

---

## 📐 2. Typography

We use **Outfit** as the primary font family for branding, controls, and readable components:

*   **Logo Text**: `22px` | Weight `800` | Emerald accent (`#10b981` / `CamNSheet`)
*   **Modal Headings**: `20px` to `26px` | Weight `600` | Modals / Drawers
*   **Buttons / CTAs**: `15px` | Weight `600` | High-visibility clickables
*   **Body Copy & Instructions**: `14px` to `15px` | Weight `400`
*   **Muted Subtext**: `14px` | Weight `300` | Captions and descriptions
*   **Diagnostics / Debug Panel**: `11px` | Monospace font (Yellow on dark base)

---

## 📱 3. Layout Regions & Navigation

1.  **Top Accent Bar**: A 4px custom brand stripe displaying a shifting linear gradient progress/accent line that blends the brand palette seamlessly:
    *   Navy (`#2D4059`) -> Red (`#EA5455`) -> Orange (`#F07B3F`) -> Yellow (`#FFD460`)
    *   Animate shifting: `linear-gradient` shifts horizontally dynamically over 8 seconds.
2.  **Header**: Dark zinc glass bar holding the camera selector, brand logo (`CamNSheet` in green), and system info settings button.
3.  **Viewfinder**: The live full-bleed canvas stretching `100vw × 100vh` with `object-fit: cover`.
4.  **Bottom action bar**: Floating circular controls bar using dark glass containers and high-quality Tabler SVG Icons (replacing generic emojis).
5.  **Onboarding slide panel**: Modal sheet showcasing gesture list items with styled green icons.

---

## ⚡ 4. Micro-Interactions & Animations

*   **Tactile Press**: Buttons scale down to `0.90` on click/touch to provide physical feedback:
    ```css
    .control-btn:active { transform: scale(0.90); }
    ```
*   **Recording Pulse**: The record button triggers a red radial breathing shadow while morphing into a rounded square.
*   **Warm Shutter Flash**: Snapping a photo triggers a brief, high-contrast warm sepia flash instead of cold white:
    ```javascript
    canvasElement.style.filter = "brightness(3) sepia(0.2)";
    ```
*   **Sheet Slide-Up**: Drawers and modals slide up from the bottom boundary with a blur backdrop.
