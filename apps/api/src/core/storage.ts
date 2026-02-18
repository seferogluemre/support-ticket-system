import path from 'path';

/**
 * Storage configuration constants
 * Central place for storage paths used across the application
 */

/**
 * Base storage path relative to process.cwd()
 * This is where all uploaded files are stored
 */
export const STORAGE_BASE_PATH = '../../storage';

/**
 * Get absolute storage path
 * @param relativePath - Path relative to storage directory (e.g., 'chat-attachments/uuid/file.png')
 * @returns Absolute path on filesystem
 */
export const getStoragePath = (...relativePath: string[]): string => {
  return path.join(process.cwd(), STORAGE_BASE_PATH, ...relativePath);
};
