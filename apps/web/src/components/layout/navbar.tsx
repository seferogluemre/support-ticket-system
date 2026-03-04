import { SidebarTrigger } from '#/components/ui/sidebar';
import { Separator } from '#/components/ui/separator';
import { ThemeSwitch } from '#/components/theme-switch';
import { ProfileDropdown } from '#/components/profile-dropdown';
import { cn } from '#/lib/utils';

export function Navbar() {
    return (
        <header
            className={cn(
                'bg-background/80 backdrop-blur-md',
                'sticky top-0 z-50',
                'flex h-14 items-center justify-between',
                'border-b px-4',
                'shrink-0',
            )}
        >
            {/* Left side */}
            <div className="flex items-center gap-3">
                <SidebarTrigger variant="outline" className="scale-125 sm:scale-100" />
                <Separator orientation="vertical" className="h-6" />
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-lg font-bold tracking-tight text-transparent dark:from-violet-400 dark:to-indigo-400">
                    VertiDesk
                </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                <ThemeSwitch />
                <ProfileDropdown />
            </div>
        </header>
    );
}
