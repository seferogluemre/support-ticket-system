/**
 * RoleHierarchyBadge Component
 * Displays role hierarchy/order as a badge
 */

import { Badge } from '#/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip';
import { cn } from '#/lib/utils';
import { ArrowUp } from 'lucide-react';

export interface RoleHierarchyBadgeProps {
  /** Role order value */
  order: number;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Show icon */
  showIcon?: boolean;
  /** Show tooltip with description */
  showTooltip?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Get hierarchy level based on order value
 */
function getHierarchyLevel(order: number): {
  label: string;
  className: string;
} {
  if (order >= 1000) {
    return {
      label: 'Çok Yüksek',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    };
  }
  if (order >= 100) {
    return {
      label: 'Yüksek',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    };
  }
  if (order >= 50) {
    return {
      label: 'Orta',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    };
  }
  if (order >= 10) {
    return {
      label: 'Düşük',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    };
  }
  return {
    label: 'Temel',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200',
  };
}

export function RoleHierarchyBadge({
  order,
  size = 'sm',
  showIcon = true,
  showTooltip = true,
  className,
}: RoleHierarchyBadgeProps) {
  const { className: levelClassName } = getHierarchyLevel(order);

  const badge = (
    <Badge
      variant="secondary"
      className={cn(
        'font-mono',
        levelClassName,
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        className,
      )}
    >
      {showIcon && (
        <ArrowUp
          className={cn(
            'mr-1',
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          )}
        />
      )}
      {order}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium">Hiyerarşi Sırası: {order}</div>
            <div className="text-muted-foreground mt-1">
              Daha yüksek değer = daha güçlü rol
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default RoleHierarchyBadge;