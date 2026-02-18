/**
 * WildcardIndicator Component
 * Displays a wildcard (*) indicator with appropriate styling
 */

import { Badge } from '#/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip';
import { cn } from '#/lib/utils';
import { Sparkles, Star } from 'lucide-react';

export interface WildcardIndicatorProps {
  /** Type of wildcard */
  type: 'global' | 'group';
  /** Group key for group wildcard (e.g., "users:*") */
  groupKey?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show tooltip */
  showTooltip?: boolean;
  /** Additional class name */
  className?: string;
}

export function WildcardIndicator({
  type,
  groupKey,
  size = 'md',
  showTooltip = true,
  className,
}: WildcardIndicatorProps) {
  const isGlobal = type === 'global';
  
  const content = (
    <Badge
      variant="secondary"
      className={cn(
        'font-semibold',
        isGlobal
          ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-200 dark:border-amber-700'
          : 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        size === 'lg' && 'text-base px-3 py-1.5',
        className,
      )}
    >
      {isGlobal ? (
        <>
          <Star className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
          Tüm Yetkiler
        </>
      ) : (
        <>
          <Sparkles className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
          Tümü
        </>
      )}
    </Badge>
  );

  if (!showTooltip) {
    return content;
  }

  const tooltipText = isGlobal
    ? 'Sistemdeki tüm yetkilere tam erişim (*)'
    : `Bu gruptaki tüm yetkilere erişim (${groupKey}:*)`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <span className="text-sm">{tooltipText}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default WildcardIndicator;