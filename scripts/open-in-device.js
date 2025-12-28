#!/usr/bin/env node

/**
 * Cross-platform script to open a URL in the connected Android device using ADB
 * Works on Windows, macOS, and Linux
 */

import { execSync } from 'child_process';
import { checkAdbInstalled, checkDeviceConnected, isValidUrl } from './utils.js';

function openUrlInDevice(url) {
  // Validate URL format
  if (!isValidUrl(url)) {
    console.error('❌ Invalid URL format. URL must start with http:// or https://');
    console.error(`   Provided URL: ${url}`);
    process.exit(1);
  }

  if (!checkAdbInstalled()) {
    console.error('❌ ADB is not installed or not in PATH');
    console.error('Please install Android SDK Platform Tools:');
    console.error('  - Windows: https://dl.google.com/android/repository/platform-tools-latest-windows.zip');
    console.error('  - macOS: brew install android-platform-tools');
    console.error('  - Linux: sudo apt-get install android-tools-adb');
    process.exit(1);
  }
  
  if (!checkDeviceConnected()) {
    console.error('❌ No Android device connected');
    console.error('Please connect your device via USB and enable USB debugging');
    console.error('Run "adb devices" to check connected devices');
    process.exit(1);
  }
  
  try {
    console.log(`📱 Opening ${url} in connected Android device...`);
    // Using template literal for execSync is acceptable here since we've validated the URL format
    execSync(`adb shell am start -a android.intent.action.VIEW -d "${url}"`, { stdio: 'inherit' });
    console.log('✅ URL opened successfully');
  } catch (error) {
    console.error('❌ Failed to open URL in device:', error.message);
    process.exit(1);
  }
}

// Get URL from command line argument
const url = process.argv[2];

if (!url) {
  console.error('❌ Usage: node open-in-device.js <URL>');
  process.exit(1);
}

openUrlInDevice(url);
