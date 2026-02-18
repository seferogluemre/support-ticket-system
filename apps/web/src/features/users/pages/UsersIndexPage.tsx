import { ConfirmDialog } from '#/components/confirm-dialog';
import { DataTable } from '#/components/data-table';
import { PageContainer } from '#/components/layout/page-container';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import type { UserShowResponse } from '#backend/modules/users/types';
import { type PaginationState } from '@tanstack/react-table';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usersColumns } from '../columns/user.columns';
import { useUserFormDialog } from '../hooks/use-user-form-dialog';
import { useUsers } from '../hooks/use-users';

export default function UsersIndexPage() {
  // State for filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserShowResponse | null>(null);

  // Form dialog
  const userFormDialog = useUserFormDialog();

  // Fetch users with filters and pagination
  const {
    users,
    meta,
    isLoading,
    createUserAsync,
    updateUserAsync,
    deleteUser,
    isUpdating,
    isDeleting,
  } = useUsers({
    search: searchKeyword || undefined,
    status: statusFilter as 'ACTIVE' | 'INACTIVE' | 'ALL' | undefined,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });

  // Handle create user
  const handleCreateUser = () => {
    userFormDialog.openCreateDialog(async (data) => {
      await createUserAsync(data as Parameters<typeof createUserAsync>[0]);
    });
  };

  // Handle edit user
  const handleEditUser = (user: UserShowResponse) => {
    userFormDialog.openEditDialog({ user }, async (data) => {
      await updateUserAsync({
        userId: user.id,
        payload: data as Parameters<typeof updateUserAsync>[0]['payload'],
      });
    });
  };

  // Open delete confirmation
  const handleDeleteClick = (user: UserShowResponse) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Create columns with action handlers
  const columnsWithActions = useMemo(
    () =>
      usersColumns.map((col) => {
        if (col.id === 'actions') {
          return {
            ...col,
            cell: ({ row }: { row: { original: UserShowResponse } }) => {
              const user = row.original;
              return (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditUser(user);
                    }}
                    disabled={isUpdating}
                    title="Edit user"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(user);
                    }}
                    className="text-red-600 hover:text-red-800"
                    disabled={isDeleting}
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            },
          };
        }
        return col;
      }),
    [isUpdating, isDeleting]
  );

  // Handle pagination change
  const handlePaginationChange = (updater: React.SetStateAction<PaginationState>) => {
    setPagination(updater);
  };

  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
        </div>
        <p className="text-muted-foreground">
          Manage system users. View, search, and manage user accounts and their roles.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleCreateUser}>
          <Plus className="w-4 h-4 mr-2" />
          New User
        </Button>

        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9 w-80"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                // Reset to first page when searching
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columnsWithActions}
            data={users || []}
            isLoading={isLoading}
            manualPagination
            pageCount={meta?.pageCount ?? -1}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            emptyMessage="No users found."
          />
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {meta && (
        <div className="text-sm text-muted-foreground">
          Showing {((pagination.pageIndex) * pagination.pageSize) + 1} to{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, meta.total)} of{' '}
          {meta.total} users
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        desc={
          userToDelete ? (
            <>
              Are you sure you want to delete user <strong>{userToDelete.name}</strong>?
              <br />
              This action cannot be undone.
            </>
          ) : (
            'Are you sure you want to delete this user?'
          )
        }
        confirmText="Delete"
        destructive
        handleConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      {/* User Form Dialog */}
      <userFormDialog.FormDialog />
      </div>
    </PageContainer>
  );
}