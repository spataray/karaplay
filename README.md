# Karaplay 🚗🎶

A minimalist, car-optimized YouTube music player designed for Android infotainment systems and tablet displays.

## 🌟 Key Features

* **Driver-Centric UI**: Oversized controls positioned on the left side for easy reach while driving.
* **Smart Radio Mode**: Search for a single song, and Karaplay automatically generates a continuous YouTube Mix (`RD` algorithm) to keep similar music flowing indefinitely.
* **Dashboard Integration**: Large, high-contrast digital clock and live weather updates (Open-Meteo API).
* **Legacy Compatibility**: Written in ES5 JavaScript to ensure smooth performance on older Smart TV and Car browsers.
* **PWA Ready**: Includes a web manifest so you can "Install" it to your car's home screen for a clean, fullscreen experience.
* **Night Mode**: Built-in support for a dimmed, high-contrast theme to reduce glare during night driving.

## 🛠️ Project Structure

* `index.html`: Main player interface and layout.
* `style.css`: Car-optimized styling (Flexbox/Absolute positioning).
* `script.js`: Player logic, Search integration, and Dashboard updates.
* `config.js`: Central configuration for Firebase and YouTube API keys.
* `manifest.json`: Progressive Web App (PWA) configuration.

## 🚀 Getting Started

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/spataray/karaplay.git
   ```
2. **Configuration**:
   Open `config.js` and ensure your YouTube API Key is correctly set.
3. **Deployment**:
   Push to GitHub and enable **GitHub Pages** in the repository settings to get your public car URL.
4. **In-Car Setup**:
   Open the URL in your car's browser and use the "Add to Home Screen" option to launch it as a standalone app.

## 🎮 How to Use

1. Tap the **Search (Magnifying Glass)** on the left sidebar.
2. Type a song or artist name.
3. Select a result to start the **Smart Radio**.
4. Use the **Gear Icon** to adjust settings like "Night Mode" or "Video Background".

---
*Created for the T.A. Station Digital Signage ecosystem.*