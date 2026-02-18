/**
 * Global Role Form Page
 * Create and edit global roles with permission assignment
 */

import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Textarea } from '#/components/ui/textarea';
import { PermissionGroupAccordion } from '#/features/authorization';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGlobalRoleMutations } from '../hooks/use-global-role-mutations';
import { useGlobalPermissionGroups, useGlobalRole } from '../hooks/use-global-roles';

export interface GlobalRoleFormPageProps {
  /** Form mode: 'create' or 'edit' */
  mode: 'create' | 'edit';
  /** Role UUID for edit mode */
  roleUuid?: string;
  /** Callback when form is submitted successfully */
  onSuccess?: () => void;
  /** Callback when cancel/back is clicked */
  onCancel?: () => void;
}

export default function GlobalRoleFormPage({
  mode,
  roleUuid,
  onSuccess,
  onCancel,
}: GlobalRoleFormPageProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch permission groups
  const { permissionGroups, isLoading: isLoadingGroups } = useGlobalPermissionGroups();

  // Fetch existing role for edit mode
  const { globalRole: existingRole, isLoading: isLoadingRole } = useGlobalRole(roleUuid || '');

  // Mutations
  const { createGlobalRoleAsync, updateGlobalRoleAsync } = useGlobalRoleMutations();

  // Populate form with existing data in edit mode
  useEffect(() => {
    if (mode === 'edit' && existingRole) {
      setName(existingRole.name);
      setDescription(existingRole.description || '');
      setSelectedPermissions(existingRole.permissions || []);
    }
  }, [mode, existingRole]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Role name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        await createGlobalRoleAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          type: 'CUSTOM', // Default to CUSTOM for user-created roles
          permissions: selectedPermissions,
        });
      } else if (roleUuid) {
        await updateGlobalRoleAsync({
          uuid: roleUuid,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            permissions: selectedPermissions,
          },
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Failed to save role:', error);
      alert('Failed to save role. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle permission change
  const handlePermissionChange = (permissions: string[]) => {
    setSelectedPermissions(permissions);
  };

  // Loading state
  if (mode === 'edit' && isLoadingRole) {
    return (
      <div className="container mx-auto flex items-center justify-center p-6 py-20">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading role...</span>
      </div>
    );
  }

  // Check if this is a system role (show warning but allow editing)
  const isSystemRole = existingRole?.type === 'BASIC' || existingRole?.type === 'ADMIN';

  return (
    <div className="container mx-auto p-6">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onCancel}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-bold text-2xl">
                {mode === 'create' ? 'Create Global Role' : `Edit Role: ${existingRole?.name}`}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === 'create' ? 'Create Role' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* System Role Warning */}
          {isSystemRole && (
            <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
              <p className="text-yellow-800 dark:text-yellow-200">
                ⚠️ This is a system role ({existingRole?.type}). Be careful when modifying its permissions.
              </p>
            </div>
          )}

          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set the role name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter role name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter role description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Select the permissions for this role. Users with this role will have access to all selected permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingGroups ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  <span>Loading permissions...</span>
                </div>
              ) : permissionGroups ? (
                <PermissionGroupAccordion
                  permissionGroups={permissionGroups as unknown as import('#/features/authorization').PermissionGroupMap}
                  selectedPermissions={selectedPermissions}
                  onPermissionChange={handlePermissionChange}
                  selectable
                  showGlobalWildcard
                  showGroupWildcard
                  showPermissionKeys
                />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No permissions available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}