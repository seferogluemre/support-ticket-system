/**
 * PermissionGroupAccordion Component
 * Displays permission groups as an accordion with selection capabilities
 * 
 * This is the core component for permission selection/display across:
 * - Global Role Form
 * - Company Role Form  
 * - Permission Viewer (read-only)
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion';
import { Badge } from '#/components/ui/badge';
import { Card, CardContent } from '#/components/ui/card';
import { Checkbox } from '#/components/ui/checkbox';
import { Skeleton } from '#/components/ui/skeleton';
import { cn } from '#/lib/utils';
import type { OrganizationType } from '#/types/api';
import { CheckCircle2, Circle, Sparkles, Star } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  countSelectedInGroup,
  isPermissionSelected,
  usePermissionGroups,
} from '../hooks/use-permission-groups';
import type { Permission, PermissionGroupMap } from '../types';
import { WildcardIndicator } from './WildcardIndicator';

export interface PermissionGroupAccordionProps {
  /** Organization type for filtering permissions (null = global only) */
  organizationType?: OrganizationType | null;

  /** Currently selected permissions */
  selectedPermissions?: string[];

  /** Callback when permissions change */
  onPermissionChange?: (permissions: string[]) => void;

  /** Read-only mode (no selection) */
  readOnly?: boolean;

  /** Enable selection mode */
  selectable?: boolean;

  /** Show global wildcard (*) option */
  showGlobalWildcard?: boolean;

  /** Show group wildcard (group:*) option */
  showGroupWildcard?: boolean;

  /** Show permission keys */
  showPermissionKeys?: boolean;

  /** Default expanded groups */
  defaultExpandedGroups?: string[];

  /** Custom permission groups (if not using hook) */
  permissionGroups?: PermissionGroupMap;

  /** Loading state */
  isLoading?: boolean;

  /** Additional class name */
  className?: string;

  /** Disable all interactions */
  disabled?: boolean;
}

export function PermissionGroupAccordion({
  organizationType,
  selectedPermissions = [],
  onPermissionChange,
  readOnly = false,
  selectable = false,
  showGlobalWildcard = false,
  showGroupWildcard = true,
  showPermissionKeys = true,
  defaultExpandedGroups,
  permissionGroups: customGroups,
  isLoading: externalLoading,
  className,
  disabled = false,
}: PermissionGroupAccordionProps) {
  // Fetch permission groups if not provided
  const { permissionGroups: fetchedGroups, isLoading: queryLoading } = usePermissionGroups({
    organizationType,
    enabled: !customGroups,
  });

  const groups = customGroups || fetchedGroups;
  const isLoading = externalLoading || queryLoading;

  // Check for global wildcard
  const hasGlobalWildcard = selectedPermissions.includes('*');

  // Default expanded groups
  const defaultExpanded = useMemo(() => {
    if (defaultExpandedGroups) return defaultExpandedGroups;
    // Expand groups that have selected permissions
    if (!groups) return [];
    return Object.entries(groups)
      .filter(([groupKey, group]) => {
        const { selected } = countSelectedInGroup(
          groupKey,
          group.permissions,
          selectedPermissions,
        );
        return selected > 0;
      })
      .map(([groupKey]) => groupKey);
  }, [groups, defaultExpandedGroups, selectedPermissions]);

  // Toggle global wildcard
  const handleGlobalWildcardToggle = useCallback(() => {
    if (!onPermissionChange || readOnly || disabled) return;

    if (hasGlobalWildcard) {
      // Remove global wildcard
      onPermissionChange(selectedPermissions.filter((p) => p !== '*'));
    } else {
      // Set only global wildcard
      onPermissionChange(['*']);
    }
  }, [hasGlobalWildcard, onPermissionChange, readOnly, disabled, selectedPermissions]);

  // Toggle group wildcard
  const handleGroupWildcardToggle = useCallback(
    (groupKey: string, groupPermissions: Permission[]) => {
      if (!onPermissionChange || readOnly || disabled) return;

      const wildcardKey = `${groupKey}:*`;
      const hasGroupWildcard = selectedPermissions.includes(wildcardKey);

      if (hasGroupWildcard) {
        // Remove group wildcard
        onPermissionChange(selectedPermissions.filter((p) => p !== wildcardKey));
      } else {
        // Add group wildcard and remove individual permissions from this group
        const groupPermissionKeys = groupPermissions.map((p) => p.key);
        const newPermissions = selectedPermissions.filter(
          (p) => p !== '*' && !groupPermissionKeys.includes(p),
        );
        onPermissionChange([...newPermissions, wildcardKey]);
      }
    },
    [onPermissionChange, readOnly, disabled, selectedPermissions],
  );

  // Toggle individual permission
  const handlePermissionToggle = useCallback(
    (permissionKey: string) => {
      if (!onPermissionChange || readOnly || disabled) return;

      const isSelected = selectedPermissions.includes(permissionKey);

      if (isSelected) {
        onPermissionChange(selectedPermissions.filter((p) => p !== permissionKey));
      } else {
        // Remove global wildcard if adding specific permission
        const newPermissions = selectedPermissions.filter((p) => p !== '*');
        onPermissionChange([...newPermissions, permissionKey]);
      }
    },
    [onPermissionChange, readOnly, disabled, selectedPermissions],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  // No groups
  if (!groups || Object.keys(groups).length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        Yetki bulunamadı
      </div>
    );
  }

  const isInteractive = selectable && !readOnly && !disabled;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Global Wildcard Option */}
      {showGlobalWildcard && isInteractive && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="wildcard-global"
                checked={hasGlobalWildcard}
                onCheckedChange={handleGlobalWildcardToggle}
                disabled={disabled}
              />
              <div className="grid gap-1 leading-none flex-1">
                <label
                  htmlFor="wildcard-global"
                  className="text-sm font-bold leading-none cursor-pointer text-amber-800 dark:text-amber-200 flex items-center"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Tüm Yetkiler (Global Wildcard)
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Bu seçenek rolü tüm yetkilerle donatır. Sadece admin rolleri için
                  önerilir. (*)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Wildcard Indicator (Read-only) */}
      {hasGlobalWildcard && readOnly && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-900 dark:text-amber-100">
                Tüm Yetkiler (Global Wildcard)
              </span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              Bu rol sistemdeki tüm yetkilere tam erişime sahiptir
            </p>
          </CardContent>
        </Card>
      )}

      {/* Permission Groups Accordion */}
      {!hasGlobalWildcard && (
        <Accordion
          type="multiple"
          defaultValue={defaultExpanded}
          className="w-full"
        >
          {Object.entries(groups).map(([groupKey, group]) => {
            const { selected, total, hasGroupWildcard: groupHasWildcard } = countSelectedInGroup(
              groupKey,
              group.permissions,
              selectedPermissions,
            );
            const hasAnyPermission = selected > 0 || groupHasWildcard;

            return (
              <AccordionItem key={groupKey} value={groupKey}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{group.description}</span>
                      
                      {/* Permission count badge */}
                      {groupHasWildcard ? (
                        <WildcardIndicator type="group" groupKey={groupKey} size="sm" />
                      ) : hasAnyPermission ? (
                        <Badge variant="default" className="text-xs bg-green-600">
                          {selected}/{total}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          0/{total}
                        </Badge>
                      )}
                    </div>

                    {/* Group Wildcard Toggle */}
                    {showGroupWildcard && isInteractive && (
                      <div
                        className="flex items-center space-x-2 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          id={`wildcard-${groupKey}`}
                          checked={groupHasWildcard}
                          onCheckedChange={() =>
                            handleGroupWildcardToggle(groupKey, group.permissions)
                          }
                          disabled={disabled || hasGlobalWildcard}
                        />
                        <label
                          htmlFor={`wildcard-${groupKey}`}
                          className="font-medium text-muted-foreground cursor-pointer flex items-center"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Tümü
                        </label>
                      </div>
                    )}
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  {/* Group Wildcard Selected Info */}
                  {groupHasWildcard && (
                    <div className="p-3 mb-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center text-green-700 dark:text-green-300 text-sm">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Bu gruptaki tüm yetkiler ({groupKey}:*)
                      </div>
                    </div>
                  )}

                  {/* Permission List */}
                  <div className="grid gap-2 pt-2 pb-4 px-1">
                    {group.permissions.map((permission) => {
                      const isDisabled =
                        disabled || hasGlobalWildcard || groupHasWildcard;
                      const isChecked =
                        groupHasWildcard ||
                        isPermissionSelected(permission.key, selectedPermissions);

                      return (
                        <div
                          key={permission.key}
                          className={cn(
                            'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                            isChecked
                              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                              : 'bg-muted/30 border-border',
                            !isChecked && readOnly && 'opacity-50',
                          )}
                        >
                          {isInteractive ? (
                            <Checkbox
                              id={permission.key}
                              checked={isChecked}
                              onCheckedChange={() => handlePermissionToggle(permission.key)}
                              disabled={isDisabled}
                            />
                          ) : isChecked ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" />
                          )}

                          <div className="grid gap-1 leading-none flex-1 min-w-0">
                            <label
                              htmlFor={isInteractive ? permission.key : undefined}
                              className={cn(
                                'text-sm font-medium leading-none',
                                isInteractive && 'cursor-pointer',
                                !isChecked && readOnly && 'text-muted-foreground',
                              )}
                            >
                              {permission.description}
                            </label>
                            {showPermissionKeys && (
                              <code
                                className={cn(
                                  'text-xs mt-1 font-mono',
                                  isChecked
                                    ? 'text-muted-foreground'
                                    : 'text-gray-400',
                                )}
                              >
                                {permission.key}
                              </code>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

export default PermissionGroupAccordion;