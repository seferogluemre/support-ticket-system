import { useEntityFormDialog } from '#/hooks/use-entity-form-dialog';
import type { UserShowResponse } from '#backend/modules/users/types';
import UserForm from '../components/UserForm';

export interface UserFormData {
  user?: UserShowResponse;
}

export function useUserFormDialog() {
  return useEntityFormDialog<UserFormData>({
    createTitle: 'Create New User',
    editTitle: 'Edit User',
    createDescription: 'Add a new user to the system with roles and permissions.',
    editDescription: 'Modify user details and status.',
    variant: 'dialog',
    renderForm: ({ mode, formData, onSave, onCancel, isLoading }) => {
      return (
        <UserForm
          mode={mode === 'create' ? 'create' : 'edit'}
          user={formData?.user}
          onSubmit={onSave}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      );
    },
  });
}