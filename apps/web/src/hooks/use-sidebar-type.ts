import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

export type SidebarType = 'company' | 'system-admin';

const SIDEBAR_TYPE_KEY = 'sidebar-type';

/**
 * Hook to manage sidebar type in sessionStorage
 *
 * Usage:
 * - If currentCompany exists: automatically sets to 'company'
 * - If no currentCompany: defaults to 'system-admin'
 * - Can be manually changed via setSidebarType
 * - Automatically navigates to appropriate dashboard when sidebar type changes
 * - Triggers event to clear company context when switching to system-admin
 */
export function useSidebarType() {
  const navigate = useNavigate();
  const [sidebarType, setSidebarTypeState] = useState<SidebarType>(() => {
    if (typeof window === 'undefined') return 'system-admin';
    
    const stored = sessionStorage.getItem(SIDEBAR_TYPE_KEY);
    return (stored === 'company' || stored === 'system-admin')
      ? stored
      : 'system-admin';
  });

  const setSidebarType = (type: SidebarType) => {
    if (typeof window === 'undefined') return;
    
    sessionStorage.setItem(SIDEBAR_TYPE_KEY, type);
    setSidebarTypeState(type);
    
    // Navigate to dashboard (same route for both sidebar types)
    navigate({ to: '/' });
    
    // Trigger a custom event to notify other components
    // CompanyContext will listen to this and clear company if type is system-admin
    window.dispatchEvent(new CustomEvent('sidebar-type-changed', { detail: type }));
  };

  // Sync with sessionStorage changes (for multi-tab support) and custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIDEBAR_TYPE_KEY && e.newValue) {
        const newType = e.newValue as SidebarType;
        if (newType === 'company' || newType === 'system-admin') {
          setSidebarTypeState(newType);
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SidebarType>;
      const newType = customEvent.detail;
      if (newType === 'company' || newType === 'system-admin') {
        setSidebarTypeState(newType);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebar-type-changed', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebar-type-changed', handleCustomEvent);
    };
  }, []);

  return { sidebarType, setSidebarType };
}

/**
 * Get current sidebar type from sessionStorage (non-reactive)
 */
export function getSidebarType(): SidebarType {
  if (typeof window === 'undefined') return 'system-admin';
  
  const stored = sessionStorage.getItem(SIDEBAR_TYPE_KEY);
  return (stored === 'company' || stored === 'system-admin') 
    ? stored 
    : 'system-admin';
}

/**
 * Set sidebar type in sessionStorage (non-reactive)
 */
export function setSidebarType(type: SidebarType) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SIDEBAR_TYPE_KEY, type);
}