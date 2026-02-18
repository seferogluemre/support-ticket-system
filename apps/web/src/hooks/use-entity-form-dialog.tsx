import { FormDialog, useFormDialog } from '#/components/form-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet';
import { type ReactNode, useState } from 'react';

export type FormMode = 'create' | 'edit';
export type FormVariant = 'dialog' | 'sheet';

export interface EntityFormDialogConfig<TFormData> {
  createTitle: string;
  editTitle: string;
  createDescription?: string;
  editDescription?: string;
  variant?: FormVariant;
  renderForm: (props: {
    mode: FormMode;
    formData?: TFormData;
    onSave: (data: unknown) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
  }) => ReactNode;
}

export interface UseEntityFormDialogReturn<TFormData> {
  open: boolean;
  isLoading: boolean;
  mode: FormMode;
  formData?: TFormData;
  openDialog: () => void;
  closeDialog: () => void;
  setIsLoading: (loading: boolean) => void;
  openCreateDialog: (onSave: (data: unknown) => Promise<void>, initialData?: Partial<TFormData>) => void;
  openEditDialog: (data: TFormData, onSave: (data: unknown) => Promise<void>) => void;
  FormDialog: () => ReactNode;
}

/**
 * Generic hook for entity form dialogs (create/edit)
 * 
 * @example
 * ```tsx
 * const roleDialog = useEntityFormDialog<RoleFormData>({
 *   createTitle: 'Create New Role',
 *   editTitle: 'Edit Role',
 *   createDescription: 'Create a new role...',
 *   editDescription: 'Modify role details...',
 *   renderForm: ({ mode, formData, onSave, onCancel, isLoading }) => (
 *     mode === 'create' ? (
 *       <CreateRoleForm onSave={onSave} onCancel={onCancel} />
 *     ) : (
 *       <EditRoleForm {...formData} onSave={onSave} onCancel={onCancel} />
 *     )
 *   ),
 * });
 * ```
 */
export function useEntityFormDialog<TFormData>(
  config: EntityFormDialogConfig<TFormData>,
): UseEntityFormDialogReturn<TFormData> {
  const dialog = useFormDialog();
  const [mode, setMode] = useState<FormMode>('create');
  const [formData, setFormData] = useState<TFormData | undefined>();
  const [onSaveCallback, setOnSaveCallback] = useState<((data: unknown) => Promise<void>) | null>(
    null,
  );

  const openCreateDialog = (onSave: (data: unknown) => Promise<void>, initialData?: Partial<TFormData>) => {
    setMode('create');
    setFormData(initialData as TFormData | undefined);
    setOnSaveCallback(() => onSave);
    dialog.openDialog();
  };

  const openEditDialog = (data: TFormData, onSave: (data: unknown) => Promise<void>) => {
    setMode('edit');
    setFormData(data);
    setOnSaveCallback(() => onSave);
    dialog.openDialog();
  };

  const handleSave = async (data: unknown) => {
    if (onSaveCallback) {
      dialog.setIsLoading(true);
      try {
        await onSaveCallback(data);
        dialog.closeDialog();
      } catch (error) {
        console.error('Form save error:', error);
        throw error;
      } finally {
        dialog.setIsLoading(false);
      }
    }
  };

  const variant = config.variant || 'dialog';
  const title = mode === 'create' ? config.createTitle : config.editTitle;
  const description = mode === 'create' ? config.createDescription : config.editDescription;

  return {
    ...dialog,
    mode,
    formData,
    openCreateDialog,
    openEditDialog,
    FormDialog: () => {
      const formContent = config.renderForm({
        mode,
        formData,
        onSave: handleSave,
        onCancel: dialog.closeDialog,
        isLoading: dialog.isLoading,
      });

      if (variant === 'sheet') {
        return (
          <Sheet open={dialog.open} onOpenChange={dialog.closeDialog}>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{title}</SheetTitle>
                {description && <SheetDescription>{description}</SheetDescription>}
              </SheetHeader>
              <div className="mt-6">{formContent}</div>
            </SheetContent>
          </Sheet>
        );
      }

      return (
        <FormDialog
          open={dialog.open}
          onOpenChange={dialog.closeDialog}
          title={title}
          description={description}
          isLoading={dialog.isLoading}
        >
          {formContent}
        </FormDialog>
      );
    },
  };
}

