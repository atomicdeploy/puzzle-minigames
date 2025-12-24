#!/usr/bin/env node

/**
 * Script to start Vite dev server and optionally open in mobile device
 * This wraps the vite command and provides mobile opening functionality
 */

import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getLocalIP() {
  try {
    const result = execSync('node ' + join(__dirname, 'get-local-ip.js'), { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    return '127.0.0.1';
  }
}

function getVitePort() {
  try {
    const result = execSync('node ' + join(__dirname, 'get-vite-port.js'), { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    // Fallback handled by get-vite-port.js
    return '3000';
  }
}

function checkDeviceConnected() {
  try {
    const output = execSync('adb devices', { encoding: 'utf8', stdio: 'pipe' });
    const lines = output.split('\n').filter(line => line.trim() && !line.includes('List of devices'));
    return lines.length > 0;
  } catch (error) {
    return false;
  }
}

function openInMobile(url) {
  try {
    console.log(`\n📱 Opening ${url} in mobile device...`);
    execSync(`node ${join(__dirname, 'open-in-device.js')} "${url}"`, { stdio: 'inherit' });
  } catch (error) {
    // Error already logged by open-in-device.js
  }
}

async function startDevServer() {
  const shouldOpenInMobile = process.argv.includes('--mobile') || process.argv.includes('-m');
  
  const ip = getLocalIP();
  const port = getVitePort();
  const url = `http://${ip}:${port}`;
  
  console.log('🚀 Starting Vite development server...');
  console.log(`📡 Network: ${url}`);
  console.log(`🏠 Local: http://localhost:${port}`);
  
  if (shouldOpenInMobile && checkDeviceConnected()) {
    console.log('📱 Will open in mobile device after server starts...');
  }
  
  // Start Vite dev server
  const viteProcess = spawn('npx', ['vite'], {
    stdio: 'inherit',
    shell: true
  });
  
  viteProcess.on('error', (error) => {
    console.error('❌ Failed to start Vite:', error.message);
    process.exit(1);
  });
  
  // If mobile flag is set, wait a bit for server to start then open in device
  if (shouldOpenInMobile && checkDeviceConnected()) {
    setTimeout(() => {
      openInMobile(url);
    }, 3000); // Wait 3 seconds for server to start
  }
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down dev server...');
    viteProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    viteProcess.kill('SIGTERM');
    process.exit(0);
  });
}

startDevServer();
