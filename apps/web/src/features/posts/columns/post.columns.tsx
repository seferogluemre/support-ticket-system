import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import type { Post } from "../types";

export const postsColumns: ColumnDef<Post>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("title")}</div>;
    },
  },
  {
    accessorKey: "content",
    header: "Content",
    cell: ({ row }) => {
      const content = row.getValue("content") as string | null;
      return (
        <div className="text-muted-foreground max-w-md truncate">
          {content || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => {
      const post = row.original;
      return <div className="text-muted-foreground">{post.author.name}</div>;
    },
  },
  {
    accessorKey: "published",
    header: "Status",
    cell: ({ row }) => {
      const published = row.getValue("published") as boolean;
      return (
        <Badge 
          className={published 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
          } 
          variant="secondary"
        >
          {published ? "Published" : "Draft"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return new Date(createdAt).toLocaleDateString();
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