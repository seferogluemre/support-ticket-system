/**
 * RoleTypeIndicator Component
 * Displays a role type (BASIC, ADMIN, CUSTOM) as a colored badge
 */

import { Badge } from '#/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip';
import { cn } from '#/lib/utils';
import { Crown, Shield, User } from 'lucide-react';
import type { RoleType } from '../types';

export interface RoleTypeIndicatorProps {
  /** Role type */
  type: RoleType;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Show icon */
  showIcon?: boolean;
  /** Show label */
  showLabel?: boolean;
  /** Show tooltip with description */
  showTooltip?: boolean;
  /** Additional class name */
  className?: string;
}

const roleTypeConfig: Record<
  RoleType,
  {
    label: string;
    description: string;
    icon: typeof Crown;
    className: string;
  }
> = {
  ADMIN: {
    label: 'Admin',
    description: 'Sistem tarafından oluşturulan yönetici rolü. Silinemez.',
    icon: Crown,
    className:
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700',
  },
  BASIC: {
    label: 'Basic',
    description: 'Sistem tarafından oluşturulan temel rol. Silinemez.',
    icon: User,
    className:
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
  },
  CUSTOM: {
    label: 'Custom',
    description: 'Kullanıcı tarafından oluşturulan özel rol.',
    icon: Shield,
    className:
      'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
  },
};

export function RoleTypeIndicator({
  type,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  showTooltip = true,
  className,
}: RoleTypeIndicatorProps) {
  const config = roleTypeConfig[type];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        config.className,
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        className,
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            showLabel && 'mr-1',
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          )}
        />
      )}
      {showLabel && config.label}
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
          <span className="text-sm">{config.description}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default RoleTypeIndicator;