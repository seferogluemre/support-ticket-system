import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { env } from '#/config/env';
import type { FileLibraryAssetShowResponse } from '#backend/modules/file-library-assets/types';
import { Download, ExternalLink, FileImage, FileText, FileVideo } from 'lucide-react';

interface FileViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: FileLibraryAssetShowResponse | null;
}

function formatFileSize(sizeStr: string): string {
  const bytes = parseInt(sizeStr, 10);
  if (isNaN(bytes)) return sizeStr;
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileTypeIcon(fileType: string) {
  switch (fileType) {
    case 'IMAGE':
      return <FileImage className="w-6 h-6 text-green-500" />;
    case 'VIDEO':
      return <FileVideo className="w-6 h-6 text-purple-500" />;
    case 'DOCUMENT':
      return <FileText className="w-6 h-6 text-blue-500" />;
    default:
      return <FileText className="w-6 h-6 text-muted-foreground" />;
  }
}

function getFileTypeBadgeVariant(fileType: string): string {
  switch (fileType) {
    case 'IMAGE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'VIDEO':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'DOCUMENT':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return '';
  }
}

export function FileViewModal({
  open,
  onOpenChange,
  asset,
}: FileViewModalProps) {
  if (!asset) return null;

  const fileUrl = `${env.apiUrl}/storage/${asset.path}`;
  const isImage = asset.fileType === 'IMAGE';
  const isVideo = asset.fileType === 'VIDEO';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = asset.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            {getFileTypeIcon(asset.fileType)}
            <span className="truncate">{asset.title || asset.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Preview */}
          <div className="bg-muted rounded-lg overflow-hidden">
            {isImage ? (
              <img
                src={fileUrl}
                alt={asset.name}
                className="w-full h-auto max-h-[300px] object-contain"
              />
            ) : isVideo ? (
              <video
                src={fileUrl}
                controls
                className="w-full h-auto max-h-[300px]"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                {getFileTypeIcon(asset.fileType)}
                <span className="ml-2 text-muted-foreground">Preview not available</span>
              </div>
            )}
          </div>

          {/* File Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Filename</p>
              <p className="font-medium truncate" title={asset.name}>{asset.name}</p>
            </div>
            {asset.title && (
              <div>
                <p className="text-muted-foreground">Title</p>
                <p className="font-medium">{asset.title}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Type</p>
              <Badge variant="outline" className="mt-1">
                {asset.type.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">File Type</p>
              <Badge variant="secondary" className={`mt-1 ${getFileTypeBadgeVariant(asset.fileType)}`}>
                {asset.fileType}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">MIME Type</p>
              <p className="font-mono text-xs">{asset.mimeType.replace(/_/g, '/')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{formatFileSize(asset.size)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(asset.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Updated</p>
              <p className="font-medium">
                {new Date(asset.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleOpenInNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}