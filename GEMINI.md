# Karaplay - Project Context

Karaplay is a minimalist, car-optimized YouTube music player designed for Android infotainment systems and tablet displays. It prioritizes driver accessibility and continuous music flow.

## 🚀 Project Overview

*   **Purpose:** Provides a distraction-free, oversized interface for playing YouTube music in vehicles.
*   **Core Technology:** Static Web Stack (HTML5, CSS3, ES5 JavaScript).
*   **Key Integrations:**
    *   **YouTube IFrame Player API:** Handles video playback and "Smart Radio" (YouTube Mix algorithm).
    *   **Open-Meteo API:** Provides live weather updates for the dashboard.
    *   **Firebase/YouTube API:** Authentication and search functionality (configured in `config.js`).
*   **Architecture:** Single-page application (SPA) with overlay-based navigation and a persistent media control bar.

## 🛠️ Building and Running

Since Karaplay is a static web application, it does not require a compilation step.

*   **Local Development:** Open `index.html` directly in any modern web browser.
*   **Deployment:** Host via GitHub Pages or any static web server.
*   **PWA Installation:** Access the hosted URL on a mobile or car browser and use "Add to Home Screen" to enable standalone mode.

## 📂 Key Files

*   `index.html`: The main entry point, containing the UI structure and the YouTube player container.
*   `script.js`: Contains all application logic, including player event handling, search, and dashboard updates. Uses **ES5 syntax** for maximum compatibility.
*   `style.css`: Defines the car-optimized layout, featuring high-contrast elements and oversized touch targets.
*   `config.js`: Centralized configuration for API keys and Firebase settings.
*   `manifest.json`: Web App Manifest for PWA support.

## 📜 Development Conventions

*   **Compatibility:** Maintain ES5 JavaScript standards to ensure functionality on older hardware (Smart TVs, early Android infotainment). Avoid modern ES6+ features like `const`, `let`, or arrow functions unless explicitly polyfilled.
*   **UI/UX:** All primary controls (Search, Settings) must be positioned on the left side of the screen (driver side for LHD vehicles).
*   **Version Tracking:** Always update the version tag in `index.html` (`#version-tag`) when making changes. The format is `vX.X.X (YYYY-MM-DD HH:mm TIMEZONE)`.
*   **Configuration:** Do not hardcode API keys in `script.js`. Use the global variables defined in `config.js`.

## 🧪 Testing

Testing is currently performed manually by:
1.  Verifying the YouTube player initializes correctly.
2.  Testing the search functionality and ensuring "Smart Radio" starts upon selection.
3.  Checking the responsiveness and alignment of UI elements on various screen sizes (specifically 10-inch tablets).
