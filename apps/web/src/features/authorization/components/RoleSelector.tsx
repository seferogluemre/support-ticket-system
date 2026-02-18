/**
 * RoleSelector Component
 * Combobox for selecting roles with type badges and member count
 */

import { Button } from '#/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover';
import { cn } from '#/lib/utils';
import type { OrganizationType } from '#/types/api';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { rolesQueryOptions } from '../queries';
import { RoleHierarchyBadge } from './RoleHierarchyBadge';
import { RoleTypeIndicator } from './RoleTypeIndicator';

// =============================================================================
// Types
// =============================================================================

/** API response type - what we actually get from the API */
interface APIRole {
  uuid: string;
  name: string;
  description: string | null;
  type: 'BASIC' | 'ADMIN' | 'CUSTOM';
  order: number;
  permissions: string[];
  organizationType: OrganizationType | null;
  organizationUuid: string | null;
  memberCount?: number;
  memberPreview?: { uuid: string; name: string; image: string | null }[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RoleSelectorProps {
  /** Selected role UUID */
  value?: string;
  /** Callback when selection changes */
  onChange: (value: string | null) => void;
  /** Filter by scope */
  scope?: 'global' | 'organization' | 'all';
  /** Filter by organization type (for organization scope) */
  organizationType?: OrganizationType;
  /** Filter by specific organization UUID */
  organizationUuid?: string;
  /** Exclude specific role UUIDs */
  excludeUuids?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Show member count in options */
  showMemberCount?: boolean;
  /** Show role type badge */
  showTypeBadge?: boolean;
  /** Show hierarchy order */
  showOrder?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function RoleSelector({
  value,
  onChange,
  scope = 'all',
  organizationType,
  organizationUuid,
  excludeUuids = [],
  placeholder = 'Select a role...',
  disabled = false,
  className,
  showMemberCount = true,
  showTypeBadge = true,
  showOrder = false,
}: RoleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Build query filters based on props
  const filters = {
    ...(scope !== 'all' && { scope }),
    ...(organizationType && { organizationType }),
    ...(organizationUuid && { organizationUuid }),
  };

  // Fetch roles
  const { data: rolesData, isLoading } = useQuery(rolesQueryOptions(filters));

  // Cast to APIRole array and filter
  const roles = useMemo(() => {
    const data = (rolesData ?? []) as APIRole[];
    return data.filter((role) => !excludeUuids.includes(role.uuid));
  }, [rolesData, excludeUuids]);

  // Filter by search
  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    const searchLower = search.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower),
    );
  }, [roles, search]);

  // Find selected role
  const selectedRole = roles.find((role) => role.uuid === value);

  const handleSelect = (roleUuid: string) => {
    onChange(roleUuid === value ? null : roleUuid);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          {selectedRole ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedRole.name}</span>
              {showTypeBadge && <RoleTypeIndicator type={selectedRole.type} size="sm" />}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{
          width: 'var(--radix-popover-trigger-width)',
          minWidth: 'var(--radix-popover-trigger-width)',
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search roles..." value={search} onValueChange={setSearch} />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-muted-foreground text-sm">Loading roles...</span>
              </div>
            ) : filteredRoles.length === 0 ? (
              <CommandEmpty>No roles found</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredRoles.map((role) => (
                  <CommandItem key={role.uuid} value={role.uuid} onSelect={() => handleSelect(role.uuid)}>
                    <Check className={cn('mr-2 h-4 w-4', value === role.uuid ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{role.name}</span>
                        {showTypeBadge && <RoleTypeIndicator type={role.type} size="sm" />}
                        {showOrder && <RoleHierarchyBadge order={role.order} size="sm" />}
                      </div>
                      {showMemberCount && role.memberCount !== undefined && (
                        <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                          <Users className="h-3 w-3" />
                          <span>{role.memberCount}</span>
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// Multi-Select Variant
// =============================================================================

export interface MultiRoleSelectorProps extends Omit<RoleSelectorProps, 'value' | 'onChange'> {
  /** Selected role UUIDs */
  value: string[];
  /** Callback when selection changes */
  onChange: (values: string[]) => void;
}

export function MultiRoleSelector({
  value,
  onChange,
  scope = 'all',
  organizationType,
  organizationUuid,
  excludeUuids = [],
  placeholder = 'Select roles...',
  disabled = false,
  className,
  showMemberCount = true,
  showTypeBadge = true,
  showOrder = false,
}: MultiRoleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Build query filters based on props
  const filters = {
    ...(scope !== 'all' && { scope }),
    ...(organizationType && { organizationType }),
    ...(organizationUuid && { organizationUuid }),
  };

  // Fetch roles
  const { data: rolesData, isLoading } = useQuery(rolesQueryOptions(filters));

  // Cast to APIRole array and filter
  const roles = useMemo(() => {
    const data = (rolesData ?? []) as APIRole[];
    return data.filter((role) => !excludeUuids.includes(role.uuid));
  }, [rolesData, excludeUuids]);

  // Filter by search
  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    const searchLower = search.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower),
    );
  }, [roles, search]);

  // Find selected roles
  const selectedRoles = roles.filter((role) => value.includes(role.uuid));

  const handleSelect = (roleUuid: string) => {
    if (value.includes(roleUuid)) {
      onChange(value.filter((v) => v !== roleUuid));
    } else {
      onChange([...value, roleUuid]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('h-auto min-h-[40px] w-full justify-between', className)}
        >
          {selectedRoles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedRoles.map((role) => (
                <span
                  key={role.uuid}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground text-sm"
                >
                  {role.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{
          width: 'var(--radix-popover-trigger-width)',
          minWidth: 'var(--radix-popover-trigger-width)',
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search roles..." value={search} onValueChange={setSearch} />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-muted-foreground text-sm">Loading roles...</span>
              </div>
            ) : filteredRoles.length === 0 ? (
              <CommandEmpty>No roles found</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredRoles.map((role) => (
                  <CommandItem key={role.uuid} value={role.uuid} onSelect={() => handleSelect(role.uuid)}>
                    <Check
                      className={cn('mr-2 h-4 w-4', value.includes(role.uuid) ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{role.name}</span>
                        {showTypeBadge && <RoleTypeIndicator type={role.type} size="sm" />}
                        {showOrder && <RoleHierarchyBadge order={role.order} size="sm" />}
                      </div>
                      {showMemberCount && role.memberCount !== undefined && (
                        <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                          <Users className="h-3 w-3" />
                          <span>{role.memberCount}</span>
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}