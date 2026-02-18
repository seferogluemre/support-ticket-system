import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Separator } from '#/components/ui/separator';
import { getAsset } from '#/lib/asset';
import { Calendar, Crown, Edit, Mail, ShieldCheck, User } from 'lucide-react';
import type { CompanyMember } from '../types';
import { getAvatarInitials } from '../utils/avatar-helpers';

interface CompanyMemberDetailViewProps {
  member?: CompanyMember;
  onEdit?: () => void;
}

export function CompanyMemberDetailView({ member, onEdit }: CompanyMemberDetailViewProps) {
  if (!member) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No member selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Avatar and Edit Button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {member.image ? (
              <AvatarImage src={getAsset(member.image)} alt={member.name} />
            ) : (
              <AvatarFallback className="text-lg bg-primary/10">
                {getAvatarInitials(member.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{member.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={member.isActive ? 'default' : 'secondary'}>
                {member.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {member.isOwner && (
                <Badge variant="default" className="bg-amber-500">
                  <Crown className="h-3 w-3 mr-1" />
                  Owner
                </Badge>
              )}
              {member.isAdmin && !member.isOwner && (
                <Badge variant="destructive">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </div>
        {onEdit && (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <Separator />

      {/* Contact Information */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            Contact Information
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{member.email}</p>
              </div>
            </div>
            {member.firstName && member.lastName && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {member.firstName} {member.lastName}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="font-medium">
                  {new Date(member.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles */}
      {member.roles && member.roles.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Roles
            </h4>
            <div className="space-y-2">
              {member.roles
                .sort((a, b) => (b.order || 0) - (a.order || 0))
                .map((role) => (
                  <div
                    key={role.uuid}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={role.type === 'ADMIN' ? 'destructive' : 'secondary'}>
                        {role.name}
                      </Badge>
                      {role.type && (
                        <span className="text-xs text-muted-foreground">({role.type})</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Added {new Date(role.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="text-sm font-medium mb-4">System Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID:</span>
              <span className="font-mono text-xs">{member.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Created:</span>
              <span>{new Date(member.userCreatedAt).toLocaleDateString()}</span>
            </div>
            {member.membershipUpdatedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{new Date(member.membershipUpdatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}