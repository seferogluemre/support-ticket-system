import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { ProjectStatus } from "@onlyjs/db/enums";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import type { Project } from "../types";

// Status colors mapping - Backend ProjectStatus enum'ından
const statusColors: Record<string, string> = {
  [ProjectStatus.DRAFT]: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  [ProjectStatus.ACTIVE]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [ProjectStatus.COMPLETED]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  [ProjectStatus.ARCHIVED]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

// Status labels - Backend ProjectStatus enum'ından
const statusLabels: Record<string, string> = {
  [ProjectStatus.DRAFT]: "Draft",
  [ProjectStatus.ACTIVE]: "Active",
  [ProjectStatus.COMPLETED]: "Completed",
  [ProjectStatus.ARCHIVED]: "Archived",
};

export const projectsColumns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Project Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>;
    },
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => {
      const project = row.original;
      return <div className="text-muted-foreground">{project.company.name}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge className={statusColors[status]} variant="secondary">
          {statusLabels[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return (
        <div className="text-muted-foreground max-w-md truncate">
          {description || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      const startDate = row.getValue("startDate") as string | null;
      if (!startDate) return <span className="text-muted-foreground">-</span>;
      return new Date(startDate).toLocaleDateString();
    },
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => {
      const endDate = row.getValue("endDate") as string | null;
      if (!endDate) return <span className="text-muted-foreground">-</span>;
      return new Date(endDate).toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Operations",
    cell: () => {
      return (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    },
  },
];