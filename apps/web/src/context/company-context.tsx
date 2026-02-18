import { CompanySelectionDialog } from '#/components/company-selection-dialog';
import { useSession } from '#/hooks/use-session';
import { getSidebarType } from '#/hooks/use-sidebar-type';
import { hasSystemScope } from '#/lib/auth';
import type { CompanyResponse } from '#/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useRouteContext } from '@tanstack/react-router';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

// Storage key for company selection (tab-specific, not shared across tabs)
// This key is also used in route loader (_authenticated/route.tsx) for SSR-like data loading
const STORAGE_KEY = 'selected-company-uuid';

interface CompanyContextValue {
    // Current active company (loaded from route context or selected by user)
    currentCompany: CompanyResponse | null;

    // All available companies for the user (from route context)
    companies: CompanyResponse[];

    // Function to change active company (updates sessionStorage and invalidates queries)
    setCurrentCompany: (company: CompanyResponse | null) => void;

    // Loading state
    isLoading: boolean;

    // Check if user can switch companies (multiple companies available)
    canSwitchCompany: boolean;
}

interface CompanyContextProviderProps {
    children: React.ReactNode;
}

const CompanyContext = createContext<CompanyContextValue | undefined>(
    undefined
);

/**
 * CompanyContextProvider
 *
 * Integrates with TanStack Router's route context for SSR-like data loading:
 * - Route loader (_authenticated/route.tsx) loads companies and currentCompany from sessionStorage
 * - This context consumes that data and provides company switching functionality
 * - When company is changed, sessionStorage is updated and queries are invalidated
 * - Next navigation will pick up the new company from sessionStorage via route loader
 */
export function CompanyContextProvider({
    children,
}: CompanyContextProviderProps) {
    const routerContext = useRouteContext({ strict: false });
    const queryClient = useQueryClient();
    const { session } = useSession();
    
    const userHasSystemScope = hasSystemScope(session);

    // Get companies, currentCompany, and totalCompanyCount from route context (loaded by route loader)
    const { companies, currentCompany: routeCurrentCompany, totalCompanyCount } = routerContext as {
        companies?: CompanyResponse[];
        currentCompany?: CompanyResponse | null;
        totalCompanyCount?: number;
    };

    // Determine if user can switch companies
    const canSwitchCompany = useMemo(() => {
        if (userHasSystemScope) {
            // System scope users can switch only if there are multiple companies in the system
            return (totalCompanyCount ?? 0) > 1;
        }
        // Company scope users can switch if they have more than one company membership
        return (companies?.length ?? 0) > 1;
    }, [companies, userHasSystemScope, totalCompanyCount]);

    // Initialize current company - auto-select if user has exactly one company
    const initialCompany = useMemo(() => {
        // If route already has a company, use it (includes system scope auto-selection from route loader)
        if (routeCurrentCompany) return routeCurrentCompany;

        // For company scope users: auto-select if they have exactly one company membership
        if (!userHasSystemScope && companies?.length === 1) {
            return companies[0];
        }

        // For system scope users: auto-selection is handled by route loader based on totalCompanyCount
        // We don't auto-select here because we need the API response which route loader already has

        return null;
    }, [routeCurrentCompany, companies, userHasSystemScope]);

    // Initialize current company from route context or auto-selection
    // Using sessionStorage makes selection tab-specific (cleared on tab close)
    const [currentCompany, setCurrentCompanyState] =
        useState<CompanyResponse | null>(initialCompany);

    // Show company selection dialog for system admins without a selected company
    const [showSelectionDialog, setShowSelectionDialog] = useState(false);
    const location = useLocation();

    // Update current company when initial company changes (e.g., companies loaded)
    useEffect(() => {
        if (initialCompany && !currentCompany) {
            setCurrentCompanyState(initialCompany);
        }
    }, [initialCompany, currentCompany]);

    useEffect(() => {
        // Dialog should show in /company-admin, /chats/bot, and /system-admin/split-view-chat routes
        // NOT in /company-member or other /system-admin routes
        const isCompanyAdminRoute =
            location.pathname.startsWith("/company-admin");
        const isSplitChatRoute = location.pathname === "/chats/bot";
        const isSplitViewChatRoute = location.pathname === "/system-admin/split-view-chat";

        // Show dialog if:
        // 1. User is in /company-admin, /chats/bot, or /system-admin/split-view-chat route, AND
        // 2. No company is currently selected, AND
        // 3. User is system admin OR has multiple companies (not auto-selected)
        const needsSelection =
            (isCompanyAdminRoute || isSplitChatRoute || isSplitViewChatRoute) &&
            !currentCompany &&
            canSwitchCompany;

        if (needsSelection) {
            setShowSelectionDialog(true);
        } else {
            setShowSelectionDialog(false);
        }
    }, [location.pathname, currentCompany, canSwitchCompany]);

    // Listen for sidebar type changes and clear company when switching to system-admin
    useEffect(() => {
        const handleSidebarTypeChange = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            const newType = customEvent.detail;
            
            // Clear company context when switching to system-admin
            if (newType === 'system-admin' && currentCompany) {
                setCurrentCompanyState(null);
                sessionStorage.removeItem(STORAGE_KEY);
                queryClient.invalidateQueries();
            }
        };

        window.addEventListener('sidebar-type-changed', handleSidebarTypeChange);
        
        return () => {
            window.removeEventListener('sidebar-type-changed', handleSidebarTypeChange);
        };
    }, [currentCompany, queryClient]);

    // Update sessionStorage when company changes
    const setCurrentCompany = useCallback(
        (company: CompanyResponse | null) => {
            if (company?.uuid) {
                sessionStorage.setItem(STORAGE_KEY, company.uuid);
            } else {
                sessionStorage.removeItem(STORAGE_KEY);
            }

            // Update state immediately for instant UI feedback
            setCurrentCompanyState(company);

            // Invalidate all queries to refetch with new company context
            queryClient.invalidateQueries();
        },
        [queryClient]
    );

    // Note: We don't sync with routeCurrentCompany after initial load
    // because we manage state locally and update sessionStorage
    // Route loader will pick up the new value on next navigation

    const handleCompanySelection = useCallback(
        (company: CompanyResponse) => {
            setCurrentCompany(company);
            setShowSelectionDialog(false);
        },
        [setCurrentCompany]
    );

    // Get current sidebar type to determine if company should be shown
    const sidebarType = getSidebarType();
    
    // Expose currentCompany if:
    // 1. User is not system scope (they always see CompanySidebar), OR
    // 2. Sidebar type is 'company' (system scope user viewing company sidebar)
    const exposedCurrentCompany = (!userHasSystemScope || sidebarType === 'company')
        ? currentCompany
        : null;

    const value = {
        currentCompany: exposedCurrentCompany,
        companies: companies ?? [],
        setCurrentCompany,
        isLoading: false,
        canSwitchCompany,
    };

    return (
        <CompanyContext.Provider value={value}>
            <CompanySelectionDialog
                open={showSelectionDialog}
                onCompanySelect={handleCompanySelection}
            />
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompanyContext() {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error(
            'useCompanyContext must be used within CompanyContextProvider. ' +
                'Make sure your component is wrapped with <CompanyContextProvider>.'
        );
    }
    return context;
}
