#!/usr/bin/env node

/**
 * Script to open the current dev server URL in a connected mobile device
 * Automatically detects IP and port
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getLocalIP() {
  try {
    const result = execSync('node ' + join(__dirname, 'get-local-ip.js'), { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    console.error('Failed to get local IP:', error.message);
    return '127.0.0.1';
  }
}

function getVitePort() {
  try {
    const result = execSync('node ' + join(__dirname, 'get-vite-port.js'), { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    console.error('Failed to get Vite port:', error.message);
    return '3000';
  }
}

const ip = getLocalIP();
const port = getVitePort();
const url = `http://${ip}:${port}`;

console.log(`📡 Detected dev server URL: ${url}`);

// Use the open-in-device script
try {
  execSync(`node ${join(__dirname, 'open-in-device.js')} "${url}"`, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
