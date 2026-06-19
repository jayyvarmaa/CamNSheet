# CamNSheet Design Specification

This document details the user interface (UI) style, visual language, design system tokens, and interactive guidelines implemented in **CamNSheet** (v2.0).

---

## 🎨 1. Palette & Color Tokens

CamNSheet utilizes a warm navy-and-yellow color scheme with bright highlights for semantic statuses.

| Variable Name | Hex Code / Value | Semantic Role |
| :--- | :--- | :--- |
| `--gc-navy` | `#2D4059` | Structural base, header, bottom bar base |
| `--gc-red` | `#EA5455` | Active recording, danger states, record buttons |
| `--gc-orange` | `#F07B3F` | Alerts, warnings, idle status states |
| `--gc-yellow` | `#FFD460` | Primary highlights, accent text, active badges |
| `--gc-navy-d` | `#1e2d3d` | Darker navy for panels & drawers |
| `--gc-navy-l` | `#3a536e` | Lighter navy for hover effects and secondary borders |
| `--card-bg` | `rgba(45, 64, 89, 0.75)` | Semi-transparent glass overlay background |
| `--card-border` | `rgba(255, 212, 96, 0.08)` | Subtle glowing border edge |

---

## 📐 2. Typography

We use **Outfit** as the primary font family for branding, controls, and readable components:

*   **Logo Text**: `22px` | Weight `800` | Yellow accent (`#FFD460` / `CamNSheet`)
*   **Modal Headings**: `20px` to `26px` | Weight `600` | Modals / Drawers
*   **Buttons / CTAs**: `15px` | Weight `600` | High-visibility clickables
*   **Body Copy & Instructions**: `14px` to `15px` | Weight `400`
*   **Muted Subtext**: `14px` | Weight `300` | Captions and descriptions
*   **Diagnostics / Debug Panel**: `11px` | Monospace font (Yellow on dark base)

---

## 📱 3. Layout Regions

1.  **Top Accent Bar**: A 4px custom brand stripe displaying a multi-color progress/accent line:
    *   Navy (`#2D4059`) -> Red (`#EA5455`) -> Orange (`#F07B3F`) -> Yellow (`#FFD460`)
2.  **Header**: Navy glass bar holding the camera selector, brand mark, and setting toggles.
3.  **Viewfinder**: The live full-bleed canvas stretching `100vw × 100vh` with `object-fit: cover`.
4.  **Bottom action tray**: Navy glass bar housing the Gallery drawer triggers, camera triggers (Snap + Record), and Help controls.

---

## ⚡ 4. Micro-Interactions & Animations

*   **Tactile Press**: Buttons scale down to `0.90` on click/touch to provide physical feedback:
    ```css
    .control-btn:active { transform: scale(0.90); }
    ```
*   **Recording Pulse**: The record button triggers a red radial breathing shadow while morphing into a rounded square:
    ```css
    @keyframes pulse-red { ... }
    ```
*   **Warm Shutter Flash**: Snapping a photo triggers a brief, high-contrast warm sepia flash instead of cold white:
    ```javascript
    canvasElement.style.filter = "brightness(3) sepia(0.2)";
    ```
*   **Sheet Slide-Up**: Drawers and modals slide up from the bottom boundary with a blur backdrop.
