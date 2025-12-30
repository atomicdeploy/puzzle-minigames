import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';

/**
 * Safe wrapper for fs.promises.realpath that handles EISDIR errors.
 * 
 * On Windows mapped/network drives, calling realpath on a directory can throw
 * EISDIR error in some configurations. This wrapper catches that error and
 * returns a resolved path instead.
 * 
 * This is a development-only safety measure and does not change application logic.
 * 
 * @param {string} p - The path to resolve
 * @returns {Promise<string>} The resolved real path
 */
export async function safeRealpath(p) {
  try {
    return await fs.realpath(p);
  } catch (error) {
    // If we get EISDIR (illegal operation on a directory), fall back to path.resolve
    if (error.code === 'EISDIR') {
      return path.resolve(p);
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Synchronous version of safeRealpath
 * 
 * @param {string} p - The path to resolve
 * @returns {string} The resolved real path
 */
export function safeRealpathSync(p) {
  try {
    return fsSync.realpathSync(p);
  } catch (error) {
    // If we get EISDIR (illegal operation on a directory), fall back to path.resolve
    if (error.code === 'EISDIR') {
      return path.resolve(p);
    }
    // Re-throw other errors
    throw error;
  }
}
