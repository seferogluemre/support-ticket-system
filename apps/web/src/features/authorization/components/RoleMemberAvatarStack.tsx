/**
 * RoleMemberAvatarStack Component
 * Displays a stack of member avatars with a count indicator
 */

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip';
import { cn } from '#/lib/utils';
import { Users } from 'lucide-react';
import type { RoleMemberPreview } from '../types';

export interface RoleMemberAvatarStackProps {
  /** Member previews to display */
  members: RoleMemberPreview[];
  /** Total member count */
  totalCount: number;
  /** Maximum avatars to show */
  maxVisible?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

const sizeConfig = {
  sm: {
    avatar: 'h-6 w-6',
    text: 'text-xs',
    overlap: '-ml-2',
    badge: 'h-6 w-6 text-xs',
  },
  md: {
    avatar: 'h-8 w-8',
    text: 'text-sm',
    overlap: '-ml-3',
    badge: 'h-8 w-8 text-sm',
  },
  lg: {
    avatar: 'h-10 w-10',
    text: 'text-base',
    overlap: '-ml-4',
    badge: 'h-10 w-10 text-base',
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function RoleMemberAvatarStack({
  members,
  totalCount,
  maxVisible = 3,
  size = 'sm',
  onClick,
  className,
}: RoleMemberAvatarStackProps) {
  const config = sizeConfig[size];
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = totalCount - visibleMembers.length;

  // No members
  if (totalCount === 0) {
    return (
      <div
        className={cn(
          'flex items-center text-muted-foreground',
          config.text,
          className,
        )}
      >
        <Users className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
        <span>0</span>
      </div>
    );
  }

  const content = (
    <div
      className={cn(
        'flex items-center',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className,
      )}
      onClick={onClick}
    >
      {/* Avatar Stack */}
      <div className="flex">
        {visibleMembers.map((member, index) => (
          <Avatar
            key={member.uuid}
            className={cn(
              config.avatar,
              'border-2 border-background',
              index > 0 && config.overlap,
            )}
          >
            {member.image && <AvatarImage src={member.image} alt={member.name} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
        ))}

        {/* Remaining Count Badge */}
        {remainingCount > 0 && (
          <div
            className={cn(
              config.badge,
              config.overlap,
              'flex items-center justify-center rounded-full bg-muted border-2 border-background font-medium',
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Total Count (if no visible members but has count) */}
      {visibleMembers.length === 0 && totalCount > 0 && (
        <div className={cn('flex items-center', config.text)}>
          <Users className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
          <span>{totalCount}</span>
        </div>
      )}
    </div>
  );

  // With tooltip showing member names
  if (visibleMembers.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium mb-1">
                {totalCount} üye
              </div>
              <div className="space-y-0.5">
                {visibleMembers.map((member) => (
                  <div key={member.uuid} className="text-muted-foreground">
                    {member.name}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="text-muted-foreground">
                    +{remainingCount} diğer
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export default RoleMemberAvatarStack;