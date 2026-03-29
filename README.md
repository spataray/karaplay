# Karaplay 🚗🎶

A minimalist, car-optimized YouTube music player designed for Android infotainment systems and tablet displays. Karaplay prioritizes driver accessibility and continuous music flow with zero distractions.

## 🌟 Key Features (v3.0.0+)

* **Unified Sliding Dashboard**: Search, Lyrics, and Settings are integrated into a background layer. Clicking a tool smoothly slides the entire UI (Video + Dashboard) to the right, revealing the tool without blocking buttons.
* **Smart Lyrics Engine**: High-contrast, large-font lyrics with a custom **Auto-Scroll** engine. Includes real-time speed controls (`+` / `-`) and a Thai-friendly fallback that extracts lyrics from YouTube descriptions.
* **Visual Queue Management**: Full list of upcoming songs with thumbnails and titles. Includes **PLAY NOW** and **DELETE** actions for manual flow control.
* **Driver-Centric UI**: Oversized controls on the driver side, supporting both LHD (Left) and RHD (Right) orientations.
* **Mobile-First Setup**: Guided setup via QR code. Scan with a phone to generate an API key and sync it to the car instantly via browser history.
* **Dashboard Integration**: Large digital clock and live weather updates (Open-Meteo API).
* **Legacy Compatibility**: Written in ES5 JavaScript for maximum compatibility with older Android head units.

## 🛠️ Project Structure

* `index.html`: Main interface with the 3-layer sliding architecture.
* `setup.html`: Dedicated mobile instruction page for API key generation.
* `style.css`: Layered styling with smooth cubic-bezier transitions.
* `script.js`: Core engine (State machine, YouTube API, Lyrics parser).
* `manifest.json`: Web App Manifest for PWA support.

## 🚀 Getting Started

1. **Deployment**: Push to GitHub and enable **GitHub Pages**.
2. **Setup**: 
   - Open the URL in your car.
   - Scan the **QR Code** with your phone.
   - Follow the phone instructions to create and sync your private YouTube API Key.
3. **PWA Installation**: Use "Add to Home Screen" for a clean, full-screen experience.

## 🎮 Navigation

1. **Media (🎧)**: Search for songs and manage your upcoming queue.
2. **Lyrics (🎤)**: View scrolling lyrics side-by-side with the video.
3. **Settings (⚙️)**: Toggle driver orientation and manage your API keys.

---
*Part of the T.A. Station Digital Signage ecosystem. v3.0.4 (2026-03-28)*
