/**
 * ScopeSelector Component
 * Allows selection between global and organization-specific scopes
 */

import { Label } from '#/components/ui/label';
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { cn } from '#/lib/utils';
import { OrganizationType } from '#/types/api';
import { Building2, Globe } from 'lucide-react';

export type ScopeValue = 'global' | 'organization';

export interface ScopeSelectorProps {
  /** Current scope value */
  value: ScopeValue;
  /** Callback when scope changes */
  onChange: (scope: ScopeValue) => void;

  /** Organization type (when scope is 'organization') */
  organizationType?: OrganizationType;
  /** Callback when organization type changes */
  onOrganizationTypeChange?: (type: OrganizationType) => void;

  /** Show organization type selector */
  showOrganizationTypeSelector?: boolean;

  /** Available organization types */
  availableOrganizationTypes?: OrganizationType[];

  /** Disabled state */
  disabled?: boolean;

  /** Layout direction */
  direction?: 'horizontal' | 'vertical';

  /** Additional class name */
  className?: string;
}

const organizationTypeLabels: Record<OrganizationType, string> = {
  [OrganizationType.COMPANY]: 'Company',
};

export function ScopeSelector({
  value,
  onChange,
  organizationType,
  onOrganizationTypeChange,
  showOrganizationTypeSelector = true,
  availableOrganizationTypes = [OrganizationType.COMPANY],
  disabled = false,
  direction = 'vertical',
  className,
}: ScopeSelectorProps) {
  const handleScopeChange = (newValue: string) => {
    onChange(newValue as ScopeValue);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Scope Selection */}
      <RadioGroup
        value={value}
        onValueChange={handleScopeChange}
        disabled={disabled}
        className={cn(
          direction === 'horizontal' && 'flex flex-row space-x-4 space-y-0',
          direction === 'vertical' && 'space-y-3',
        )}
      >
        {/* Global Option */}
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="global" id="scope-global" />
          <Label
            htmlFor="scope-global"
            className={cn(
              'flex items-center cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <Globe className="h-4 w-4 mr-2 text-blue-600" />
            <div>
              <span className="font-medium">Global</span>
              {direction === 'vertical' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tüm sistemi kapsar
                </p>
              )}
            </div>
          </Label>
        </div>

        {/* Organization Option */}
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="organization" id="scope-organization" />
          <Label
            htmlFor="scope-organization"
            className={cn(
              'flex items-center cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <Building2 className="h-4 w-4 mr-2 text-green-600" />
            <div>
              <span className="font-medium">Organizasyon</span>
              {direction === 'vertical' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Belirli bir organizasyona özel
                </p>
              )}
            </div>
          </Label>
        </div>
      </RadioGroup>

      {/* Organization Type Selector */}
      {value === 'organization' && showOrganizationTypeSelector && (
        <div className="pl-7">
          <Label className="text-sm text-muted-foreground mb-2 block">
            Organizasyon Tipi
          </Label>
          <Select
            value={organizationType}
            onValueChange={(val) => onOrganizationTypeChange?.(val as OrganizationType)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Tip seçin..." />
            </SelectTrigger>
            <SelectContent>
              {availableOrganizationTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {organizationTypeLabels[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default ScopeSelector;