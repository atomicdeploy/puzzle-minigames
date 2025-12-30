import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for domain-specific static files
const domainConfig = new Map();

/**
 * Configure static file serving for a specific domain
 * @param {string} domain - The domain name (e.g., 'example.com')
 * @param {string} staticPath - Path to static files directory
 */
export function configureDomain(domain, staticPath) {
  const resolvedPath = path.resolve(staticPath);
  
  if (!fs.existsSync(resolvedPath)) {
    console.warn(`⚠️  Static directory does not exist: ${resolvedPath}`);
  } else {
    domainConfig.set(domain, resolvedPath);
    console.log(`✅ Configured domain '${domain}' -> ${resolvedPath}`);
  }
}

/**
 * Get the static files path for a given domain
 * @param {string} hostname - The hostname from the request
 * @returns {string|null} - The static path or null if not configured
 */
export function getDomainStaticPath(hostname) {
  // Try exact match first
  if (domainConfig.has(hostname)) {
    return domainConfig.get(hostname);
  }
  
  // Try without port
  const hostnameWithoutPort = hostname.split(':')[0];
  if (domainConfig.has(hostnameWithoutPort)) {
    return domainConfig.get(hostnameWithoutPort);
  }
  
  // Try wildcard subdomain match (e.g., *.example.com)
  const parts = hostnameWithoutPort.split('.');
  if (parts.length > 2) {
    const wildcard = `*.${parts.slice(-2).join('.')}`;
    if (domainConfig.has(wildcard)) {
      return domainConfig.get(wildcard);
    }
  }
  
  return null;
}

/**
 * Middleware to serve static files based on domain
 */
export function domainStaticMiddleware(req, res, next) {
  const hostname = req.hostname || req.headers.host?.split(':')[0] || 'localhost';
  const staticPath = getDomainStaticPath(hostname);
  
  if (!staticPath) {
    // No domain-specific config, continue to next middleware
    return next();
  }
  
  // Construct file path
  const requestPath = req.path === '/' ? '/index.html' : req.path;
  const filePath = path.join(staticPath, requestPath);
  
  // Security: prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(staticPath)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // File not found, try index.html for SPA routing
      const indexPath = path.join(staticPath, 'index.html');
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (indexErr || !indexStats.isFile()) {
          return next(); // Continue to next middleware
        }
        return res.sendFile(indexPath);
      });
    } else {
      // File exists, serve it
      res.sendFile(filePath);
    }
  });
}

/**
 * Get all configured domains
 */
export function getConfiguredDomains() {
  return Array.from(domainConfig.keys());
}
