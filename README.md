# Karaplay 🚗🎶

A minimalist, car-optimized YouTube music player designed for Android infotainment systems and tablet displays.

## 🌟 Key Features

* **Driver-Centric UI**: Oversized controls positioned on the left side for easy reach while driving.
* **Up Next Queue**: View and jump ahead in your current YouTube Mix with a dedicated queue overlay.
* **Fun Fact Overlay**: Automatically fetches and displays trivia or artist biographies from Wikipedia for every new song.
* **Up Next Toast**: Sleek slide-in notifications that show you the title of the next track coming up.
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

1. Tap the **Search (🔍)** on the left sidebar.
2. Type a song or artist name and select a result to start the **Smart Radio**.
3. Tap the **Queue (☰)** button to see what's coming up next or jump to a future track.
4. Watch the bottom-right of the screen for **Fun Facts** about the current track!
5. Use the **Gear Icon (⚙️)** to adjust settings like "Night Mode" or "Driver Orientation".

---
*Created for the T.A. Station Digital Signage ecosystem.*