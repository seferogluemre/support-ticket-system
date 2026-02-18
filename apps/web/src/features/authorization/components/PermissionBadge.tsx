/**
 * PermissionBadge Component
 * Displays a single permission as a badge with optional description
 */

import { Badge } from '#/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip';
import { cn } from '#/lib/utils';

export interface PermissionBadgeProps {
  /** Permission key (e.g., "users:list") */
  permissionKey: string;
  /** Permission description */
  description?: string;
  /** Show the permission key instead of description */
  showKey?: boolean;
  /** Variant style */
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  /** Size */
  size?: 'sm' | 'md';
  /** Additional class name */
  className?: string;
  /** Show tooltip with key on hover */
  showTooltip?: boolean;
}

export function PermissionBadge({
  permissionKey,
  description,
  showKey = false,
  variant = 'outline',
  size = 'sm',
  className,
  showTooltip = true,
}: PermissionBadgeProps) {
  const displayText = showKey ? permissionKey : description || permissionKey;

  const badge = (
    <Badge
      variant={variant}
      className={cn(
        'font-mono',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        className,
      )}
    >
      {displayText}
    </Badge>
  );

  if (showTooltip && description && !showKey) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <code className="text-xs">{permissionKey}</code>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (showTooltip && showKey && description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <span className="text-sm">{description}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

export default PermissionBadge;