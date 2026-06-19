# GesturCam Design Specification

This document details the user interface (UI) style, visual language, design system tokens, and interactive guidelines implemented in **GesturCam**.

---

## 🎨 1. Core Aesthetics & Visual Direction

GesturCam utilizes a **modern dark-mode glassmorphic** design system, tailored specifically for mobile-first utility. The UI is designed to feel high-tech, minimal, and premium, prioritizing the live camera feed while presenting control widgets as overlay cards that float organically.

Key style pillars:
*   **Deep Contrast**: Solid absolute blacks (`#000000` / `#09090b`) as the backdrop frame to make the bright camera feed pop.
*   **Glassmorphic Overlays (`backdrop-filter`)**: Floating UI containers use a semi-transparent dark background combined with a fine blur to merge seamlessly with the scene behind them.
*   **Vibrant Accent Coloring**: Subtle but clear emerald greens for active/system statuses, and rich warning-reds for recording indicators.

---

## 📐 2. Typography

We use **Outfit** as the primary font family—a geometric, clean sans-serif that balances modern elegance with high legibility.

*   **Font Weights**:
    *   `300`: Light (description subtext)
    *   `400`: Regular (body copy, options text)
    *   `600`: Semi-Bold (buttons, section labels)
    *   `800`: Extra-Bold (branding, titles)
*   **Font Scale**:
    *   App Logo: `22px` / Weight `800`
    *   Modal Headings: `20px` to `26px`
    *   Body / Labels: `14px` to `15px`
    *   Diagnostic Debug text: `10px` to `12px` (set in monospace font)

---

## 🎨 3. Design System Tokens (CSS Variables)

Defined in [`style.css`](file:///x:/PROJECTS/CameraAndShet/style.css):

| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--bg-dark` | `#09090b` (Zinc 950) | Base body color / canvas margins |
| `--card-bg` | `rgba(24, 24, 27, 0.75)` | Glass container backgrounds |
| `--card-border` | `rgba(255, 255, 255, 0.08)` | Very fine borders on containers |
| `--primary` | `#10b981` (Emerald 500) | Primary actions, status badges, active indicators |
| `--primary-hover` | `#059669` | Hover states for primary buttons |
| `--danger` | `#ef4444` (Red 500) | Recording button, active record timer |
| `--danger-hover` | `#dc2626` | Recording button active states |
| `--text-main` | `#f4f4f5` (Zinc 100) | Primary text readability |
| `--text-muted` | `#a1a1aa` (Zinc 400) | Secondary instruction labels |
| `--glass-blur` | `blur(16px)` | Backdrop blur style for modals/buttons |

---

## 📱 4. Mobile-First Layout Architecture

The application layout is structurally mapped for optimal single-thumb usage on mobile devices:

1.  **Header (`app-header`)**: Absolute-positioned at the top with a gradient fallback to guarantee readability over bright video feeds. Holds the camera selector and system toggle.
2.  **Viewfinder (`viewfinder`)**: The canvas occupies `100%` viewport width and height (`100vh`) using `object-fit: cover` to behave like a native iOS/Android camera application.
3.  **Bottom Action Bar (`bottom-bar`)**: Floats above the canvas at the bottom of the screen. Holds the primary action triggers:
    *   **Gallery Trigger** (Left): Quick-reach button displaying a live badge of captured frames.
    *   **Main Capturing Group** (Center): Split into **Snap Photo** (white circle indicator) and **Record Video** (outer glowing red circle).
    *   **Help Button** (Right): Easy-to-access onboarding tour restart.

---

## ⚡ 5. Micro-Animations & Interactions

Transitions and animations are designed to provide tactile, responsive feedback:

*   **Tactile Active States**: Interactive buttons scale down smoothly (`transform: scale(0.9)`) on click/touch to mimic physical button presses.
*   **Recording Pulse Animation**: When video recording is active, the recording button pulses outwards using a repeating radial shadow ring (`pulse-red`) and shifts into a square shape.
*   **Camera Flash Indicator**: When a photo is taken, the main canvas flashes bright white momentarily (`filter: brightness(3)`) to emulate a camera shutter flash.
*   **Slide Transitions**: Modal cards slide up smoothly from the bottom (`translateY(20px)` to `translateY(0)`) matching native mobile drawer sheets.
