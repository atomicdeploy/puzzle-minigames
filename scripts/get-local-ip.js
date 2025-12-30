#!/usr/bin/env node

/**
 * Cross-platform script to get the local IP address
 * Works on Windows, macOS, and Linux
 */

import { networkInterfaces } from 'os';

function getLocalIP() {
  const nets = networkInterfaces();
  
  // Priority order: Ethernet, WiFi, then others
  const priorities = ['Ethernet', 'Wi-Fi', 'en0', 'eth0', 'wlan0'];
  
  for (const priority of priorities) {
    for (const name of Object.keys(nets)) {
      if (name.toLowerCase().includes(priority.toLowerCase())) {
        for (const net of nets[name]) {
          // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
          if (net.family === 'IPv4' && !net.internal) {
            return net.address;
          }
        }
      }
    }
  }
  
  // Fallback: find any non-internal IPv4 address
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  return '127.0.0.1';
}

const ip = getLocalIP();
console.log(ip);
