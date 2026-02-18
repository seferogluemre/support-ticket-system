import { useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export interface UseBodyScrollLockOptions {
  /**
   * Whether to only lock on mobile devices
   * @default true
   */
  mobileOnly?: boolean;
}

/**
 * Hook to lock body scroll when a modal/overlay is open.
 * Useful for fullscreen modals, sidebars, and mobile overlays.
 *
 * Features:
 * - Preserves scroll position when locking/unlocking
 * - Prevents iOS Safari bounce effect
 * - Optional mobile-only mode (reactive to screen size changes)
 *
 * @param isLocked - Whether scroll should be locked
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Lock scroll on mobile only (default)
 * useBodyScrollLock(isModalOpen);
 *
 * // Lock scroll on all devices
 * useBodyScrollLock(isModalOpen, { mobileOnly: false });
 * ```
 */
export function useBodyScrollLock(
  isLocked: boolean,
  options: UseBodyScrollLockOptions = {},
) {
  const { mobileOnly = true } = options;
  const isMobile = useIsMobile();

  // Determine if we should actually lock
  const shouldLock = isLocked && (!mobileOnly || isMobile);

  useEffect(() => {
    if (!shouldLock) return;

    // Save current scroll position and body styles
    const scrollY = window.scrollY;
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    // Lock body scroll
    // Using position:fixed prevents iOS Safari from scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      // Restore body styles
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.width = originalStyles.width;

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [shouldLock]);
}

