# CamNSheet

CamNSheet is a browser-based webcam experience that turns your camera into a live, gesture-controlled visual studio. Using MediaPipe hand tracking, the app reacts to different hand poses and transforms the live feed with filters, overlays, magnification, and cinematic effects.

## Overview

This project is a creative camera app built with vanilla HTML, CSS, and JavaScript. It lets you:

- use your webcam in real time
- trigger live effects with hand gestures
- capture still photos and videos from the canvas output
- preview media in a built-in gallery
- switch between available cameras
- explore a guided onboarding demo for the available gestures

## Features

- Real-time camera feed and camera selection
- MediaPipe hand detection for single- and dual-hand gestures
- Gesture-based visual effects including:
  - VHS-style glitch
  - dither / grain overlay
  - spotlight
  - water ripple
  - invert
  - sepia and color-shift filters
  - matrix rain
  - mystic portal shield effect
  - two-hand magnifying glass zoom lens
- Photo capture and video recording from the live output
- Local gallery with preview, download, and delete actions
- Debug panel for gesture and camera status
- Onboarding overlay explaining the controls and gestures

## Gesture Guide

| Gesture | Effect |
| --- | --- |
| Fist | Dither / black-and-white contrast |
| Peace sign | VHS glitch overlay |
| Index finger | Spotlight focus |
| Open palm | Mystic shield effect |
| Thumb up | Invert colors |
| Rock on | Sepia / warm tint |
| Call me | Psychedelic hue shift |
| OK sign | Matrix rain overlay |
| L gesture | Blueprint-style inversion |
| Three fingers | Water ripple distortion |
| Two-hand peace/index signs | Magnifying glass zoom |

## Run Locally

Because the app uses the browser camera, it should be served from a local web server instead of opened directly as a file.

1. Open a terminal in the project folder.
2. Start a simple server:

```bash
python -m http.server 8000
```

3. Open the app in your browser:

```text
http://localhost:8000
```

4. Allow camera access when prompted.

## Project Structure

```text
.
├── index.html        # app layout and UI structure
├── style.css         # visual design and interface styles
├── script.js         # MediaPipe logic, gestures, filters, capture tools
├── logo.png          # app branding asset
├── README.md         # project documentation
```

## Notes

- Camera access requires a browser permission prompt.
- Localhost is recommended because browser camera APIs are restricted for insecure origins.
- The app is built using browser APIs and CDN-hosted MediaPipe libraries, so no build step is required.

## License

This project is provided as-is for educational and creative experimentation. Add your own license text if you plan to distribute it publicly.

