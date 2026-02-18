import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Settings, Trash2 } from "lucide-react";
import type { CompanyRole } from "../types";

export const companyRolesColumns: ColumnDef<CompanyRole>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const role = row.original;
      return (
        <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
          {role.name}
        </span>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return <div className="text-muted-foreground">{row.getValue("description")}</div>;
    },
  },
  {
    id: "members",
    header: "Members",
    cell: ({ row }) => {
      const role = row.original;
      const memberPreview = role.memberPreview || [];
      const memberCount = role.memberCount || 0;
      const remainingCount = memberCount - memberPreview.length;

      if (memberCount === 0) {
        return (
          <div className="text-muted-foreground text-sm">
            No members
          </div>
        );
      }

      return (
        <div className="flex -space-x-2 hover:space-x-1 transition-all cursor-pointer">
          {memberPreview.map((member) => (
            <Avatar key={member.uuid} className="w-8 h-8 border-2 border-background">
              {member.image ? (
                <AvatarImage src={member.image} alt={member.name} />
              ) : (
                <AvatarFallback className="text-xs bg-blue-500 text-white">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              )}
            </Avatar>
          ))}
          {remainingCount > 0 && (
            <Avatar className="w-8 h-8 border-2 border-background">
              <AvatarFallback className="text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                +{remainingCount}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: () => {
      return (
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Operations",
    cell: () => {
      return (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    },
  },
];
