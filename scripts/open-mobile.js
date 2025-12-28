#!/usr/bin/env node

/**
 * Script to open the current dev server URL in a connected mobile device
 * Automatically detects IP and port
 */

import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getLocalIP, getVitePort } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ip = getLocalIP();
const port = getVitePort();
const url = `http://${ip}:${port}`;

console.log(`📡 Detected dev server URL: ${url}`);

// Use the open-in-device script
try {
  const scriptPath = join(__dirname, 'open-in-device.js');
  execFileSync('node', [scriptPath, url], { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
