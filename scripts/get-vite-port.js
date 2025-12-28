#!/usr/bin/env node

/**
 * Cross-platform script to extract the port from vite.config.js
 * Dynamically reads the port configuration
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVitePort() {
  const configPath = join(__dirname, '..', 'vite.config.js');
  
  try {
    const configContent = readFileSync(configPath, 'utf8');
    
    // Look for server.port configuration
    const portMatch = configContent.match(/port:\s*(\d+)/);
    
    if (portMatch && portMatch[1]) {
      return portMatch[1];
    }
    
    // Default Vite port
    return '3000';
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Log error if it's not just a missing file
      console.error('Error reading vite.config.js:', error.message);
    }
    // Return default Vite port
    return '3000';
  }
}

const port = getVitePort();
console.log(port);
