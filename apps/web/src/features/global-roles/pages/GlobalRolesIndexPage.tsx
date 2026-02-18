/**
 * Global Roles Index Page
 * Lists all global (system-wide) roles with search, filter, and CRUD operations
 */

import { DataTable } from '#/components/data-table';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { ScrollArea } from '#/components/ui/scroll-area';
import { PermissionGroupAccordion, RoleTypeIndicator } from '#/features/authorization';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Edit, Plus, Search, Settings, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { globalRolesColumns } from '../columns/role.columns';
import { useGlobalRoleMutations } from '../hooks/use-global-role-mutations';
import { useGlobalPermissionGroups, useGlobalRoles } from '../hooks/use-global-roles';
import type { GlobalRole } from '../types';

export default function GlobalRolesIndexPage() {
  const navigate = useNavigate();

  // Global roles data
  const { globalRoles: rolesData, isLoading } = useGlobalRoles();
  const { deleteGlobalRoleAsync } = useGlobalRoleMutations();

  // State management
  const [searchKeyword, setSearchKeyword] = useState('');

  // Permission modal state
  const [selectedRole, setSelectedRole] = useState<GlobalRole | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  // Fetch permission groups for modal
  const { permissionGroups } = useGlobalPermissionGroups();

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!rolesData) return [];
    if (!searchKeyword.trim()) return rolesData;

    const keyword = searchKeyword.toLowerCase();
    return rolesData.filter(
      (role: GlobalRole) =>
        role.name.toLowerCase().includes(keyword) ||
        (role.description && role.description.toLowerCase().includes(keyword)),
    );
  }, [rolesData, searchKeyword]);

  // Handle create role
  const handleCreateRole = () => {
    // TODO: Route will be available after route generation
    navigate({ to: '/global-roles/create' as string });
  };

  // Handle edit role
  const handleEditRole = (role: GlobalRole) => {
    // TODO: Route will be available after route generation
    navigate({ to: `/global-roles/${role.uuid}` as string });
  };

  // Handle role deletion
  const handleDeleteRole = (roleUuid: string) => {
    const role = rolesData?.find((r: GlobalRole) => r.uuid === roleUuid);
    if (!role) return;

    // System roles cannot be deleted
    if (role.type === 'BASIC' || role.type === 'ADMIN') {
      alert('System roles cannot be deleted');
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete the role "${role.name}"?`);
    if (confirmDelete) {
      try {
        deleteGlobalRoleAsync(roleUuid);
      } catch (error) {
        console.error('Failed to delete global role:', error);
      }
    }
  };

  // Handle view permissions
  const handleViewPermissions = (role: GlobalRole) => {
    setSelectedRole(role);
    setIsPermissionModalOpen(true);
  };

  // Update columns with handlers
  // biome-ignore lint/suspicious/noExplicitAny: Column type mapping
  const updatedColumns = globalRolesColumns.map((col: any) => {
    // biome-ignore lint/suspicious/noExplicitAny: Column type checking
    if ((col as any).accessorKey === 'permissions') {
      return {
        ...col,
        // biome-ignore lint/suspicious/noExplicitAny: Row type from react-table
        cell: ({ row }: any) => {
          const role = row.original;
          return (
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewPermissions(role)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      };
    }

    // biome-ignore lint/suspicious/noExplicitAny: Column type checking
    if ((col as any).id === 'actions') {
      return {
        ...col,
        // biome-ignore lint/suspicious/noExplicitAny: Row type from react-table
        cell: ({ row }: any) => {
          const role = row.original;
          const isSystemRole = role.type === 'BASIC' || role.type === 'ADMIN';
          return (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditRole(role)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleDeleteRole(role.uuid)}
                disabled={isSystemRole}
                title={isSystemRole ? 'System roles cannot be deleted' : 'Delete role'}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      };
    }

    return col;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="font-bold text-2xl">Global Roles</h1>
            <Badge variant="outline" className="text-muted-foreground">
              System-wide
            </Badge>
            <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleCreateRole}>
              <Plus className="mr-2 h-4 w-4" />
              New Role
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search roles..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading global roles...</div>
          </div>
        ) : (
          <DataTable columns={updatedColumns} data={filteredRoles} />
        )}

        {/* Permission Modal */}
        <Dialog open={isPermissionModalOpen} onOpenChange={setIsPermissionModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedRole?.name}
                {selectedRole && <RoleTypeIndicator type={selectedRole.type} size="sm" />}
              </DialogTitle>
              <DialogDescription>{selectedRole?.description}</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              {/* Global Wildcard Badge */}
              {selectedRole?.permissions.includes('*') && (
                <div className="mb-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      🌟 All Permissions (Global Wildcard)
                    </span>
                  </div>
                  <p className="mt-2 text-blue-700 text-sm dark:text-blue-300">
                    This role has access to all permissions in the system
                  </p>
                </div>
              )}

              {/* Permission Groups */}
              {!selectedRole?.permissions.includes('*') && permissionGroups && (
                <PermissionGroupAccordion
                  permissionGroups={permissionGroups as unknown as import('#/features/authorization').PermissionGroupMap}
                  selectedPermissions={selectedRole?.permissions || []}
                  readOnly
                />
              )}

              {/* No permissions */}
              {!selectedRole?.permissions.includes('*') && selectedRole?.permissions.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">No permissions assigned to this role</div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}