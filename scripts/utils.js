#!/usr/bin/env node

/**
 * Shared utility functions for ADB and script execution
 */

import { execSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Check if ADB is installed and available in PATH
 * @returns {boolean}
 */
export function checkAdbInstalled() {
  try {
    execSync('adb version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if any Android device is connected via ADB
 * @returns {boolean}
 */
export function checkDeviceConnected() {
  try {
    const output = execSync('adb devices', { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => line.trim() && !line.includes('List of devices'));
    return lines.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Safely execute a Node.js script using execFileSync to avoid command injection
 * @param {string} scriptPath - Path to the script to execute
 * @returns {string} - Trimmed output from the script
 */
export function executeNodeScript(scriptPath) {
  try {
    const result = execFileSync('node', [scriptPath], { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    throw error;
  }
}

/**
 * Get the local IP address
 * @returns {string}
 */
export function getLocalIP() {
  try {
    const scriptPath = join(__dirname, 'get-local-ip.js');
    const ip = executeNodeScript(scriptPath);
    if (ip === '127.0.0.1') {
      console.warn('⚠️  Warning: Could not detect network IP, using localhost. Mobile device may not be able to connect.');
    }
    return ip;
  } catch (error) {
    console.warn('⚠️  Warning: Could not detect network IP, using localhost. Mobile device may not be able to connect.');
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error while attempting to detect local IP:', error.message);
    }
    return '127.0.0.1';
  }
}

/**
 * Get the Vite port from configuration
 * @returns {string}
 */
export function getVitePort() {
  try {
    const scriptPath = join(__dirname, 'get-vite-port.js');
    return executeNodeScript(scriptPath);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('⚠️ Failed to determine Vite port, falling back to 3000:', error.message);
    }
    // Fallback handled by get-vite-port.js
    return '3000';
  }
}

/**
 * Poll a URL until it becomes available or timeout is reached
 * @param {string} url - URL to poll
 * @param {number} maxAttempts - Maximum number of attempts (default: 10)
 * @param {number} delayMs - Delay between attempts in milliseconds (default: 1000)
 * @returns {Promise<boolean>} - True if server is ready, false if timeout
 */
export async function waitForServer(url, maxAttempts = 10, delayMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Use fetch if available (Node 18+), otherwise use a simpler approach
      if (typeof fetch !== 'undefined') {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return true;
        }
      } else {
        // Fallback for older Node versions - try to connect
        const { default: http } = await import('http');
        const urlObj = new URL(url);
        await new Promise((resolve, reject) => {
          const req = http.get(url, (res) => {
            resolve();
          });
          req.on('error', reject);
          req.setTimeout(1000);
        });
        return true;
      }
    } catch (error) {
      // Server not ready yet, wait and retry
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  return false;
}
