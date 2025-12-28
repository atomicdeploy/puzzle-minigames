#!/usr/bin/env node

/**
 * Script to start Vite dev server and optionally open in mobile device
 * This wraps the vite command and provides mobile opening functionality
 */

import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getLocalIP, getVitePort, checkDeviceConnected, waitForServer } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants for server polling
const MAX_WAIT_ATTEMPTS = 30;
const WAIT_DELAY_MS = 1000;

function openInMobile(url) {
  try {
    console.log(`\n📱 Opening ${url} in mobile device...`);
    const scriptPath = join(__dirname, 'open-in-device.js');
    execFileSync('node', [scriptPath, url], { stdio: 'inherit' });
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
  
  // If mobile flag is set, wait for server to be ready then open in device
  if (shouldOpenInMobile) {
    (async () => {
      console.log('⏳ Waiting for Vite server to be ready...');
      const isReady = await waitForServer(url, MAX_WAIT_ATTEMPTS, WAIT_DELAY_MS);
      
      if (!isReady) {
        console.warn('⚠️  Server did not respond in time. Attempting to open anyway...');
      }
      
      if (checkDeviceConnected()) {
        openInMobile(url);
      } else {
        console.warn('📱 Skipping opening in mobile device: no device connected.');
      }
    })();
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
