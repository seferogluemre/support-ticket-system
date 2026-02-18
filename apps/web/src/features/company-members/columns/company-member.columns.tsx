import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { getAsset } from '#/lib/asset';
import { type ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CompanyMember } from '../types';
import { getAvatarInitials } from '../utils/avatar-helpers';

// Delete confirmation component
function DeleteConfirmation({
  member,
  onConfirm,
  onCancel,
}: {
  member: CompanyMember;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Member Sil</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>{member.name}</strong> adlı member'ı silmek istediğinizden emin misiniz?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Bu işlem geri alınamaz ve member'ın tüm verileri silinecektir.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="mr-2">
            İptal
          </Button>
          <Button onClick={onConfirm} className="bg-red-500 hover:bg-red-600">
            Sil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const companyMembersColumns = (
  onDelete: (userId: string) => void,
  onView?: (member: CompanyMember) => void,
  onEdit?: (member: CompanyMember) => void,
): ColumnDef<CompanyMember>[] => [
  {
    accessorKey: 'name',
    header: 'Display Name',
    cell: ({ row }) => {
      const member = row.original;

      return (
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            {member.image ? (
              <AvatarImage src={getAsset(member.image)} alt={member.name} />
            ) : (
              <AvatarFallback className="text-xs">{getAvatarInitials(member.name)}</AvatarFallback>
            )}
          </Avatar>
          <span className="font-medium">{member.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      return <div className="text-muted-foreground">{row.getValue('email')}</div>;
    },
  },
  {
    accessorKey: 'isAdmin',
    header: 'Administrator',
    cell: ({ row }) => {
      const isAdmin = row.getValue('isAdmin') as boolean;
      return (
        <Badge variant={isAdmin ? 'default' : 'outline'} className="text-xs">
          {isAdmin ? 'Yes' : 'No'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isOwner',
    header: 'Owner',
    cell: ({ row }) => {
      const isOwner = row.getValue('isOwner') as boolean;
      return (
        <Badge variant={isOwner ? 'default' : 'outline'} className="text-xs">
          {isOwner ? 'Yes' : 'No'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'joinedAt',
    header: 'Joined',
    cell: ({ row }) => {
      const joinedAt = row.getValue('joinedAt') as Date;
      return (
        <div className="text-muted-foreground text-sm">
          {new Date(joinedAt).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Active',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean;
      return (
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      );
    },
  },
  {
    id: 'roles',
    header: 'Roles',
    cell: ({ row }) => {
      const member = row.original;
      const roles = member.roles || [];

      return (
        <div className="flex flex-wrap gap-1">
          {roles.length > 0 ? (
            roles.slice(0, 2).map((role) => (
              <Badge key={role.uuid} variant="outline" className="text-xs">
                {role.name}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">No roles</span>
          )}
          {roles.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{roles.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Operations',
    cell: ({ row }) => {
      const member = row.original;
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);

      const handleDelete = () => {
        onDelete(member.userId);
        setShowDeleteDialog(false);
      };

      return (
        <div className="flex items-center space-x-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onView(member)}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onEdit(member)}
              title="Edit member"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            title="Delete member"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {showDeleteDialog && (
            <DeleteConfirmation
              member={member}
              onConfirm={handleDelete}
              onCancel={() => setShowDeleteDialog(false)}
            />
          )}
        </div>
      );
    },
  },
];