# Karaplay 🚗🎶

A minimalist, car-optimized YouTube music player designed for Android infotainment systems and tablet displays. Karaplay prioritizes driver accessibility and continuous music flow with zero distractions.

## 🌟 Key Features

* **Unified Media Manager**: A single, two-column overlay combining Search, Search History, and your upcoming Queue for maximum efficiency while driving.
* **Manual Queue Control (v2.0.0)**: A custom-built queuing engine that replaces buggy YouTube Mixes with a 100% reliable, script-controlled playlist. View, play now, or cancel upcoming tracks with ease.
* **Recently Found**: Automatically saves your last 10 successful searches locally, allowing you to re-play your favorites without typing or spending API quota.
* **Driver-Centric UI**: Oversized, high-contrast controls positioned on the driver side (supports LHD and RHD orientations).
* **Fun Fact Overlay**: Automatically fetches and displays trivia or artist biographies from Wikipedia for every new song.
* **Smart Up-Next Toast**: Sleek slide-in notifications that show you the title of the next track coming up.
* **Dashboard Integration**: Large digital clock and live weather updates (Open-Meteo API).
* **Legacy Compatibility**: Written in ES5 JavaScript to ensure smooth performance on older Smart TV and Car browsers (Android 4.4+ compatible).
* **PWA Ready**: Optimized for "Add to Home Screen" to provide a clean, standalone fullscreen experience.

## 🛠️ Project Structure

* `index.html`: Main player interface and layout.
* `style.css`: Car-optimized styling with oversized touch targets.
* `script.js`: Core logic, including manual queue management and YouTube API integration.
* `config.js`: Central configuration for API keys.
* `manifest.json`: Web App Manifest for PWA support.

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

1. Tap the **Media (🎧)** button on the driver-side sidebar.
2. **Search** for a song/artist or pick from your **Recently Found** history.
3. Once selected, Karaplay starts the song and automatically builds a custom "Smart Radio" queue in the background.
4. Manage your flow using the **Up Next** column on the right—tap a song to jump to it, or tap **✕** to cancel it.
5. Use the **Gear (⚙️)** icon to toggle driver orientation or night mode.

---
*Part of the T.A. Station Digital Signage ecosystem.*
