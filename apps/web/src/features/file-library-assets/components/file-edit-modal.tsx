import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import type { FileLibraryAssetShowResponse } from '#backend/modules/file-library-assets/types';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: FileLibraryAssetShowResponse | null;
  onSave: (uuid: string, data: { name?: string; title?: string }) => Promise<void>;
  isSaving?: boolean;
}

export function FileEditModal({
  open,
  onOpenChange,
  asset,
  onSave,
  isSaving = false,
}: FileEditModalProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setTitle(asset.title || '');
    }
  }, [asset]);

  const handleSubmit = async () => {
    if (!asset) return;
    
    await onSave(asset.uuid, { name, title: title || undefined });
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
          <DialogDescription>
            Update the file name and title.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file-title">Title (optional)</Label>
            <Input
              id="file-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Display title for the file"
            />
            <p className="text-xs text-muted-foreground">
              A friendly name to display instead of the filename.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-name">Filename</Label>
            <Input
              id="file-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="filename.ext"
            />
            <p className="text-xs text-muted-foreground">
              The actual filename stored in the system.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}