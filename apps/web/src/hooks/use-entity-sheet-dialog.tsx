import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '#/components/ui/sheet';
import { type ReactNode, useState } from 'react';

export type SheetSide = 'top' | 'right' | 'bottom' | 'left';
export type SheetMode = 'view' | 'edit';

export interface EntitySheetDialogConfig<TEntity> {
  title: string | ((entity?: TEntity) => string);
  description?: string | ((entity?: TEntity) => string);
  side?: SheetSide;
  renderContent: (props: {
    mode: SheetMode;
    entity?: TEntity;
    onClose: () => void;
    onEdit?: () => void;
    onSave?: (data: unknown) => Promise<void>;
    isLoading: boolean;
  }) => ReactNode;
}

export interface UseEntitySheetDialogReturn<TEntity> {
  open: boolean;
  isLoading: boolean;
  mode: SheetMode;
  entity?: TEntity;
  openSheet: (entity: TEntity, mode?: SheetMode) => void;
  closeSheet: () => void;
  setMode: (mode: SheetMode) => void;
  setIsLoading: (loading: boolean) => void;
  SheetDialog: () => ReactNode;
}

/**
 * Hook for entity sheet/drawer dialogs (view/edit)
 * 
 * Ideal for:
 * - Detail views with inline editing
 * - Entity inspectors
 * - Right-side panels
 * - Quick view/edit workflows
 * 
 * @example
 * ```tsx
 * const userSheet = useEntitySheetDialog<User>({
 *   title: (user) => user?.name || 'User Details',
 *   description: 'View and edit user information',
 *   side: 'right',
 *   renderContent: ({ mode, entity, onClose, onEdit, onSave }) => (
 *     mode === 'view' ? (
 *       <UserView user={entity} onEdit={onEdit} />
 *     ) : (
 *       <UserEditForm user={entity} onSave={onSave} onCancel={onClose} />
 *     )
 *   ),
 * });
 * 
 * // Usage
 * userSheet.openSheet(user, 'view');
 * ```
 */
export function useEntitySheetDialog<TEntity>(
  config: EntitySheetDialogConfig<TEntity>,
): UseEntitySheetDialogReturn<TEntity> {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SheetMode>('view');
  const [entity, setEntity] = useState<TEntity | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const openSheet = (entityData: TEntity, initialMode: SheetMode = 'view') => {
    setEntity(entityData);
    setMode(initialMode);
    setOpen(true);
  };

  const closeSheet = () => {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setEntity(undefined);
      setMode('view');
      setIsLoading(false);
    }, 200);
  };

  const handleEdit = () => {
    setMode('edit');
  };

  const handleSave = async (data: unknown) => {
    // Callback for saving - will be passed to renderContent
    setIsLoading(true);
    try {
      // The actual save logic is handled in renderContent
      await Promise.resolve(data);
    } finally {
      setIsLoading(false);
    }
  };

  const title = typeof config.title === 'function' ? config.title(entity) : config.title;
  const description =
    typeof config.description === 'function'
      ? config.description(entity)
      : config.description;

  return {
    open,
    isLoading,
    mode,
    entity,
    openSheet,
    closeSheet,
    setMode,
    setIsLoading,
    SheetDialog: () => (
      <Sheet open={open} onOpenChange={closeSheet}>
        <SheetContent side={config.side || 'right'} className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="mt-6">
            {config.renderContent({
              mode,
              entity,
              onClose: closeSheet,
              onEdit: handleEdit,
              onSave: handleSave,
              isLoading,
            })}
          </div>
        </SheetContent>
      </Sheet>
    ),
  };
}

