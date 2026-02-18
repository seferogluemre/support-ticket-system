import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import type { FileLibraryAssetShowResponse } from '#backend/modules/file-library-assets/types';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, FileImage, FileText, FileVideo, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

// ====================================================================
// Helper functions
// ====================================================================
function formatFileSize(sizeStr: string): string {
  const bytes = parseInt(sizeStr, 10);
  if (isNaN(bytes)) return sizeStr;
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileTypeIcon(fileType: string) {
  switch (fileType) {
    case 'IMAGE':
      return <FileImage className="w-4 h-4 text-green-500" />;
    case 'VIDEO':
      return <FileVideo className="w-4 h-4 text-purple-500" />;
    case 'DOCUMENT':
      return <FileText className="w-4 h-4 text-blue-500" />;
    default:
      return <FileText className="w-4 h-4 text-muted-foreground" />;
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

// ====================================================================
// Column actions callback type
// ====================================================================
export type FileLibraryAssetActions = {
  onView?: (asset: FileLibraryAssetShowResponse) => void;
  onEdit?: (asset: FileLibraryAssetShowResponse) => void;
  onDelete?: (asset: FileLibraryAssetShowResponse) => void;
};

// ====================================================================
// Column definitions factory
// ====================================================================
export const createFileLibraryAssetColumns = (
  actions?: FileLibraryAssetActions
): ColumnDef<FileLibraryAssetShowResponse>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      const title = row.original.title;
      const fileType = row.original.fileType;
      
      return (
        <div className="flex items-center gap-3">
          {getFileTypeIcon(fileType)}
          <div className="flex flex-col">
            <span className="font-medium truncate max-w-[200px]" title={name}>
              {title || name}
            </span>
            {title && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={name}>
                {name}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <Badge variant="outline" className="text-xs">
          {type.replace(/_/g, ' ')}
        </Badge>
      );
    },
    meta: {
      className: 'w-[150px]',
    },
  },
  {
    accessorKey: 'fileType',
    header: 'File Type',
    cell: ({ row }) => {
      const fileType = row.getValue('fileType') as string;
      return (
        <Badge variant="secondary" className={getFileTypeBadgeVariant(fileType)}>
          {fileType}
        </Badge>
      );
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'mimeType',
    header: 'MIME Type',
    cell: ({ row }) => {
      const mimeType = row.getValue('mimeType') as string;
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {mimeType.replace(/_/g, '/')}
        </span>
      );
    },
    meta: {
      className: 'w-[140px]',
    },
  },
  {
    accessorKey: 'size',
    header: 'Size',
    cell: ({ row }) => {
      const size = row.getValue('size') as string;
      return (
        <span className="font-mono text-xs">
          {formatFileSize(size)}
        </span>
      );
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      const date = new Date(createdAt);
      return (
        <div className="flex flex-col">
          <span className="text-sm">{date.toLocaleDateString()}</span>
          <span className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</span>
        </div>
      );
    },
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const asset = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions?.onView && (
              <DropdownMenuItem onClick={() => actions.onView?.(asset)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            )}
            {actions?.onEdit && (
              <DropdownMenuItem onClick={() => actions.onEdit?.(asset)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {actions?.onDelete && (
              <DropdownMenuItem
                onClick={() => actions.onDelete?.(asset)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    meta: {
      className: 'w-[50px]',
    },
  },
];

// Default columns without actions
export const fileLibraryAssetColumns = createFileLibraryAssetColumns();