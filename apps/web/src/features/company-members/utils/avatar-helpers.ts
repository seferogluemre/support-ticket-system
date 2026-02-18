/**
 * Avatar Helper Utilities
 *
 * Provides functions for generating avatar initials and deterministic colors
 */

import {
  IconBrandChrome,
  IconBrandEdge,
  IconBrandFirefox,
  IconBrandOpera,
  IconBrandSafari,
  IconBrandSamsungpass,
  IconGlobe,
} from '@tabler/icons-react';

/**
 * Color palette for avatars - Tailwind 400 shades with consistent brightness
 * All colors use white text for good contrast
 */
export const AVATAR_COLOR_PALETTE = [
  { bg: 'bg-blue-400', text: 'text-white' },
  { bg: 'bg-purple-400', text: 'text-white' },
  { bg: 'bg-pink-400', text: 'text-white' },
  { bg: 'bg-rose-400', text: 'text-white' },
  { bg: 'bg-orange-400', text: 'text-white' },
  { bg: 'bg-amber-400', text: 'text-white' },
  { bg: 'bg-yellow-400', text: 'text-white' },
  { bg: 'bg-lime-400', text: 'text-white' },
  { bg: 'bg-green-400', text: 'text-white' },
  { bg: 'bg-emerald-400', text: 'text-white' },
  { bg: 'bg-teal-400', text: 'text-white' },
  { bg: 'bg-cyan-400', text: 'text-white' },
  { bg: 'bg-sky-400', text: 'text-white' },
  { bg: 'bg-indigo-400', text: 'text-white' },
  { bg: 'bg-violet-400', text: 'text-white' },
  { bg: 'bg-fuchsia-400', text: 'text-white' },
] as const;

/**
 * Generate initials from a name
 * Takes first letter of each word (max 2 characters)
 *
 * @param name - The name to generate initials from
 * @param fallback - Fallback character if name is empty
 * @returns Uppercase initials (1-2 characters)
 *
 * @example
 * getAvatarInitials("John Doe") // "JD"
 * getAvatarInitials("Alice") // "A"
 * getAvatarInitials("") // "?"
 */
export function getAvatarInitials(name: string, fallback = '?'): string {
  if (!name) return fallback;

  // Split by space and get first alphanumeric character from each word
  const initials = name
    .split(' ')
    .map((word) => {
      // Find the first alphanumeric character in the word
      const match = word.match(/[a-zA-Z0-9]/);
      return match ? match[0] : '';
    })
    .filter(Boolean) // Remove empty strings
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return initials || fallback;
}

/**
 * Generate a deterministic color from a string
 * Uses a simple hash function to consistently map strings to colors
 *
 * @param str - The string to generate color from (usually a name)
 * @returns Object with background and text color classes
 *
 * @example
 * getColorFromString("John Doe") // { bg: "bg-blue-400", text: "text-white" }
 * getColorFromString("Alice Smith") // { bg: "bg-emerald-400", text: "text-white" }
 */
export function getColorFromString(str: string): { bg: string; text: string } {
  // Create a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use absolute value and modulo to get consistent index
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTE.length;
  return AVATAR_COLOR_PALETTE[index];
}

/**
 * Generate avatar data (initials + color) from a name
 * Convenience function that combines getAvatarInitials and getColorFromString
 *
 * @param name - The name to generate avatar data from
 * @returns Object with initials and color classes
 *
 * @example
 * const avatar = getAvatarData("John Doe");
 * // { initials: "JD", bg: "bg-blue-400", text: "text-white" }
 */
export function getAvatarData(name: string) {
  return {
    initials: getAvatarInitials(name),
    ...getColorFromString(name),
  };
}

/**
 * Get browser icon component based on browser name
 *
 * @param browser - Browser name string
 * @returns Icon component constructor
 */
export const getBrowserIcon = (browser?: string | null) => {
  if (!browser) return IconGlobe;
  const browserLower = browser.toLowerCase();

  if (browserLower.includes('chrome')) return IconBrandChrome;
  if (browserLower.includes('firefox')) return IconBrandFirefox;
  if (browserLower.includes('safari')) return IconBrandSafari;
  if (browserLower.includes('edge')) return IconBrandEdge;
  if (browserLower.includes('opera')) return IconBrandOpera;
  if (browserLower.includes('samsung')) return IconBrandSamsungpass;

  return IconGlobe;
};
