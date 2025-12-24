# Mobile Development Scripts

This directory contains cross-platform Node.js scripts for mobile development workflow with ADB and Vite.

## Available Scripts

### Core Utilities

#### `get-local-ip.js`
Detects the local IP address of the machine. Works on Windows, macOS, and Linux.

**Usage:**
```bash
node scripts/get-local-ip.js
```

**Output:** The local IP address (e.g., `192.168.1.100`)

#### `get-vite-port.js`
Extracts the configured port from `vite.config.js`.

**Usage:**
```bash
node scripts/get-vite-port.js
```

**Output:** The Vite server port (e.g., `3000`)

### Mobile Development

#### `dev-server.js`
Starts the Vite development server with optional automatic mobile browser opening.

**Usage:**
```bash
# Start dev server normally
node scripts/dev-server.js

# Start dev server and open in mobile device
node scripts/dev-server.js --mobile
# or
node scripts/dev-server.js -m
```

**NPM Scripts:**
- `npm run dev` - Start dev server
- `npm run dev:mobile` - Start dev server and open in mobile
- `npm run dev:vite` - Start Vite directly (original behavior)

#### `open-mobile.js`
Opens the current dev server URL in a connected Android device using ADB.

**Usage:**
```bash
node scripts/open-mobile.js
```

**NPM Script:**
- `npm run mobile:open` - Open dev server in mobile device

#### `open-in-device.js`
Generic script to open any URL in a connected Android device.

**Usage:**
```bash
node scripts/open-in-device.js <URL>
```

**Example:**
```bash
node scripts/open-in-device.js http://192.168.1.100:3000
```

#### `launch-scrcpy.js`
Launches scrcpy for screen mirroring of the connected Android device.

**Usage:**
```bash
node scripts/launch-scrcpy.js
```

**NPM Script:**
- `npm run mobile:scrcpy` - Launch scrcpy

## Prerequisites

### ADB (Android Debug Bridge)

All mobile scripts require ADB to be installed and available in your PATH.

**Installation:**

- **Windows:** Download and extract [Platform Tools](https://dl.google.com/android/repository/platform-tools-latest-windows.zip), then add to PATH
- **macOS:** `brew install android-platform-tools`
- **Linux:** `sudo apt-get install android-tools-adb` or `sudo yum install android-tools`

**Verify installation:**
```bash
adb version
```

### scrcpy (Optional)

For screen mirroring functionality, install scrcpy:

- **Windows:** Download from [GitHub Releases](https://github.com/Genymobile/scrcpy/releases)
- **macOS:** `brew install scrcpy`
- **Linux:** `sudo apt-get install scrcpy` or `sudo snap install scrcpy`

**Verify installation:**
```bash
scrcpy --version
```

## Device Setup

1. **Enable Developer Options** on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Developer Options will appear in Settings

2. **Enable USB Debugging:**
   - Go to Settings > Developer Options
   - Enable "USB Debugging"

3. **Connect via USB:**
   - Connect your Android device to your computer via USB
   - Accept the "Allow USB Debugging" prompt on your device

4. **Verify connection:**
   ```bash
   adb devices
   ```
   You should see your device listed.

## Workflow Examples

### Standard Development

```bash
# Start the dev server
npm run dev

# In another terminal, open in mobile device
npm run mobile:open
```

### Mobile-First Development

```bash
# Start dev server and automatically open in mobile
npm run dev:mobile

# Launch scrcpy to mirror the device screen
npm run mobile:scrcpy
```

### Manual Testing

```bash
# Get the dev server URL
LOCAL_IP=$(node scripts/get-local-ip.js)
PORT=$(node scripts/get-vite-port.js)
echo "Dev server: http://$LOCAL_IP:$PORT"

# Open specific URL in device
node scripts/open-in-device.js http://$LOCAL_IP:$PORT/some-path
```

## Network Requirements

**Important:** Your computer and mobile device must be on the same network for the dev server to be accessible from the mobile device.

- If using USB debugging, ensure USB tethering is not interfering
- Check your firewall settings allow connections on port 3000 (or your configured port)
- Some corporate/school networks may block device-to-device communication

## Troubleshooting

### "ADB is not installed"

Make sure you've installed Android Platform Tools and added it to your system PATH.

### "No Android device connected"

1. Check USB cable is properly connected
2. Run `adb devices` to verify device is detected
3. Try running `adb kill-server` then `adb start-server`
4. Check USB Debugging is enabled on your device

### "Failed to open URL in device"

1. Ensure your device is unlocked
2. Check that a browser app is installed on your device
3. Try opening the URL manually first to verify network connectivity

### Dev server not accessible from mobile

1. Verify both devices are on the same network
2. Check firewall settings on your computer
3. Try accessing the URL manually from mobile browser first
4. Ensure Vite's `server.host` is set to `true` in `vite.config.js`

## Platform-Specific Notes

### Windows

- Use PowerShell or CMD with Node.js installed
- Add Platform Tools directory to PATH via System Environment Variables
- May need to run as Administrator for first-time ADB setup

### macOS

- Requires Xcode Command Line Tools for some dependencies
- Use Homebrew for easiest installation of tools
- Grant necessary permissions when prompted

### Linux

- May need to add udev rules for ADB device recognition
- Common rule file: `/etc/udev/rules.d/51-android.rules`
- Reload udev: `sudo udevadm control --reload-rules`

## Script Architecture

All scripts are written in Node.js with ES modules for maximum cross-platform compatibility:

- No shell-specific syntax (bash/cmd/PowerShell)
- Uses Node's built-in `os`, `fs`, `path`, and `child_process` modules
- Handles platform differences internally
- Provides clear error messages and installation instructions

## Contributing

When adding new scripts:

1. Use ES module syntax (`import`/`export`)
2. Add shebang: `#!/usr/bin/env node`
3. Test on Windows, macOS, and Linux if possible
4. Provide clear error messages with actionable instructions
5. Update this README with usage information
