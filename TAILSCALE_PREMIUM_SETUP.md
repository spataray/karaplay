# Bypassing YouTube Sign-in Blocks on Android Infotainment 🚗🔒

This guide provides the instructions to configure your **Karaplay** environment for YouTube Premium/Premium Lite. If Google blocks your account sign-in on your car's head unit with the *"This browser or app may not be secure"* error, you have two primary ways to bypass this block—**with or without installing Tailscale on the infotainment screen itself.**

---

## 💡 Why Does the Login Get Blocked?
Google blocks account logins from unrecognized, low-security embedded browsers (WebViews) found in aftermarket car head units, especially over unfamiliar mobile hotspots or cellular data. To bypass this, you need to sign in while your connection appears to originate from a **trusted residential IP address** (like your home network).

Once you are successfully logged in, the YouTube session cookies are stored persistently in the infotainment browser. You can then drive anywhere on cellular data, and Karaplay will play completely ad-free!

---

## 🛣️ Option A: Without Tailscale on the Infotainment Center (Easiest!)

You **do not** need to install Tailscale or any other VPN software on your car's infotainment system if you use your home network to authorize the login once.

### Step 1: Connect to Home Wi-Fi
1. Park your car in the driveway or garage where it can connect to your **Home Wi-Fi network**.
2. Open your car's infotainment settings and connect it to your home Wi-Fi.

### Step 2: Perform the Login
1. Open the browser on your car infotainment screen.
2. Go to **Karaplay** -> Settings (⚙️) -> and click **SIGN IN TO YOUTUBE** (or navigate directly to `https://www.youtube.com`).
3. Click **Sign In** and enter your Google Account credentials.
4. **Success!** Because your car is connected to your trusted home residential network, Google will authorize the sign-in without throwing security blocks.

### Step 3: Drive Away Ad-Free!
1. Turn off your Wi-Fi connection and let your head unit switch back to your mobile hotspot or cellular data.
2. Open Karaplay and click **RELOAD APP** (⚙️).
3. The browser will persistently hold onto the login cookies, allowing you to stream ad-free YouTube music wherever you go!

---

## 🌐 Option B: Using Tailscale on the Infotainment Center (On the Go)

If your car is parked too far from your home Wi-Fi and you must perform the login while away from home, you can use Tailscale directly on the head unit to route through your home network.

### Step 1: Configure Your Home Machine as an Exit Node
You need to authorize a device on your home network to route external internet traffic. 

#### On your Home Linux machine:
1. **Enable IP Forwarding** (required for Linux to act as a router):
   ```bash
   echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
   echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
   sudo sysctl -p /etc/sysctl.d/99-tailscale.conf
   ```
2. **Restart Tailscale and Advertise as an Exit Node**:
   ```bash
   sudo tailscale up --advertise-exit-node
   ```

#### On your Home macOS machine (e.g., `steven-macmini`):
1. Open the Tailscale app.
2. Click the Tailscale icon in the menu bar.
3. Select **Exit Node** -> Check **Run as Exit Node**.

#### In the Tailscale Admin Console:
1. Open your [Tailscale Admin Console](https://login.tailscale.com/admin/machines).
2. Find your home machine, click the **three dots (...)** next to it, and select **Edit route settings**.
3. Toggle on **Use as exit node** and click **Save**.

### Step 2: Install and Configure Tailscale on the Car Head Unit
1. **Install the App**:
   - Download **Tailscale** from the Play Store on your head unit, or sideload the official Android APK via a USB drive.
2. **Log In**:
   - Launch the Tailscale app on your head unit and authenticate it.
3. **Enable the Exit Node**:
   - Tap the top-right menu (three dots) -> **Exit Nodes** -> Select your home machine (e.g., `steven-macmini` or your Linux machine).
   - Toggle Tailscale **ON**.
4. **Verify connection**: Visit `https://ifconfig.me` on the car browser; it should display your home public IP address.

### Step 3: Sign In and Launch Karaplay
1. Go to `https://www.youtube.com` in your car browser.
2. Click **Sign In** and enter your Google account credentials. It will pass cleanly!
3. Open Karaplay, reload the app, and enjoy ad-free music!

> [!TIP]
> **Performance Tip:** Once you've logged in, the YouTube cookie is stored on your device. You can turn off **Tailscale** (or the Exit Node) on the car head unit while driving to preserve cellular bandwidth and speed, as the cookie remains valid. Simply turn it back on if you ever get logged out and need to authenticate again.

> [!IMPORTANT]
> **PWA / WebView Troubleshooting Tip:** If you are running Karaplay inside a third-party PWA wrapper or launcher on your head unit:
> * Many PWA wrappers have a setting to **"Open external links in external system browser"** enabled by default.
> * If enabled, clicking **SIGN IN TO YOUTUBE** will open your system's default browser (like Chrome), meaning the premium session cookies will not be saved inside your PWA's internal WebView container.
> * **To fix this:** Disable "Open external links in external browser" in your PWA app's settings, click sign-in again so that the YouTube sign-in page opens directly inside the PWA's internal browser, log in, and reload Karaplay.

---
*Part of the T.A. Station Digital Signage ecosystem. Updated 2026-05-25.*
