import { cn } from '#/lib/utils';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';

interface UuidDisplayProps {
  uuid: string;
  /** Number of characters to show at start and end (default: 4) */
  truncateLength?: number;
  className?: string;
}

/**
 * UUID Display Component
 * 
 * Displays a truncated UUID (xxxx...xxxx) with:
 * - Tooltip showing full UUID on hover
 * - Click to copy functionality with toast notification
 */
export function UuidDisplay({ uuid, truncateLength = 4, className }: UuidDisplayProps) {
  const truncatedUuid = uuid.length > truncateLength * 2 + 3
    ? `${uuid.slice(0, truncateLength)}...${uuid.slice(-truncateLength)}`
    : uuid;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uuid);
      toast.success('UUID copied to clipboard');
    } catch {
      toast.error('Failed to copy UUID');
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'font-mono text-xs text-muted-foreground',
            'hover:text-foreground cursor-pointer transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded',
            className
          )}
        >
          {truncatedUuid}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-mono text-xs">{uuid}</p>
      </TooltipContent>
    </Tooltip>
  );
}