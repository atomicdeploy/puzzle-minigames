#!/usr/bin/env node

/**
 * Cross-platform script to launch scrcpy for screen mirroring
 * Works on Windows, macOS, and Linux
 */

import { execSync, spawn } from 'child_process';
import { checkAdbInstalled, checkDeviceConnected } from './utils.js';

function checkScrcpyInstalled() {
  try {
    execSync('scrcpy --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function launchScrcpy() {
  if (!checkAdbInstalled()) {
    console.error('❌ ADB is not installed or not in PATH');
    console.error('Please install Android SDK Platform Tools first');
    process.exit(1);
  }
  
  if (!checkScrcpyInstalled()) {
    console.error('❌ scrcpy is not installed or not in PATH');
    console.error('Please install scrcpy:');
    console.error('  - Windows: https://github.com/Genymobile/scrcpy/releases');
    console.error('  - macOS: brew install scrcpy');
    console.error('  - Linux: sudo apt-get install scrcpy');
    process.exit(1);
  }
  
  if (!checkDeviceConnected()) {
    console.error('❌ No Android device connected');
    console.error('Please connect your device via USB and enable USB debugging');
    process.exit(1);
  }
  
  console.log('📱 Launching scrcpy...');
  console.log('Controls:');
  console.log('  - MOD+f: Fullscreen');
  console.log('  - MOD+g: Resize window to 1:1');
  console.log('  - MOD+h: Home button');
  console.log('  - MOD+b: Back button');
  console.log('  - MOD+o: Turn screen off');
  console.log('  - MOD is Ctrl on Windows/Linux, Cmd on macOS');
  console.log('');
  
  try {
    // Launch scrcpy in the foreground
    const scrcpyProcess = spawn('scrcpy', [], { 
      stdio: 'inherit',
      shell: true
    });
    
    scrcpyProcess.on('error', (error) => {
      console.error('❌ Failed to launch scrcpy:', error.message);
      process.exit(1);
    });
    
    scrcpyProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ scrcpy exited with code ${code}`);
        process.exit(code);
      }
    });
  } catch (error) {
    console.error('❌ Failed to launch scrcpy:', error.message);
    process.exit(1);
  }
}

launchScrcpy();
