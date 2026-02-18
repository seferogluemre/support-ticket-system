import { DataTable } from "#/components/data-table";
import { PageContainer } from "#/components/layout/page-container";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { postsColumns } from "../columns";
import { usePosts } from "../hooks";
import type { Post } from "../types";

export default function PostsIndexPage() {
    const navigate = useNavigate();

    // State for filters
    const [searchKeyword, setSearchKeyword] = useState("");

    // Fetch posts with filters
    const { posts, isLoading, deletePost, isUpdating, isDeleting } =
        usePosts({
            search: searchKeyword || undefined,
        });

    // Handle create post - navigate to create page
    const handleCreatePost = () => {
        navigate({ to: "/posts/create" });
    };

    // Handle edit post - navigate to edit page
    const handleEditPost = (post: Post) => {
        navigate({
            to: "/posts/$uuid",
            params: { uuid: post.uuid },
        });
    };

    // Delete handler
    const handleDeletePost = (postUuid: string) => {
        const confirmDelete = confirm(
            "Bu gönderiyi silmek istediğinizden emin misiniz?"
        );
        if (confirmDelete) {
            deletePost(postUuid);
        }
    };

    // Create columns with delete handler
    const columnsWithActions = useMemo(
        () =>
            postsColumns.map((col) => {
                if (col.id === "actions") {
                    return {
                        ...col,
                        cell: ({ row }: { row: { original: Post } }) => {
                            const post = row.original;
                            return (
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleEditPost(post)
                                        }
                                        disabled={isUpdating}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleDeletePost(post.uuid)
                                        }
                                        className="text-red-600 hover:text-red-800"
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        },
                    };
                }
                return col;
            }),
        [isUpdating, isDeleting]
    );

    return (
        <PageContainer>
            <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Posts</h1>
                </div>
                <p className="text-muted-foreground">
                    Manage your blog posts. Create, update, and publish content for your audience.
                </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={handleCreatePost}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Post
                </Button>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search posts..."
                            className="pl-9 w-80"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <DataTable
                        columns={columnsWithActions}
                        data={posts || []}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
            </div>
        </PageContainer>
    );
}