import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PostForm } from "../components";
import { usePost, usePosts } from "../hooks";
import type { PostUpdatePayload } from "../types";


export default function PostEditPage() {
    const { uuid } = useParams({
        from: "/_authenticated/posts/$uuid",
    });
    const navigate = useNavigate();

    // Fetch post data
    const { post, isLoading: isPostLoading } = usePost(uuid);
    const { updatePostAsync, isUpdating } = usePosts();

    // biome-ignore lint/suspicious/noExplicitAny: Form data type from PostForm
    const handleSubmit = async (data: any) => {
        const payload: PostUpdatePayload = {
            title: data.title,
            content: data.content,
            published: data.published,
        };

        await updatePostAsync({
            postUuid: uuid,
            payload,
        });
        // Success toast is shown by the hook
        navigate({ to: "/posts" });
    };

    const handleCancel = () => {
        navigate({ to: "/posts" });
    };

    if (isPostLoading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The post you are looking for does not exist.
                    </p>
                    <Button onClick={handleCancel}>Back to Posts</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={handleCancel}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Posts
                </Button>
                <h1 className="text-2xl font-bold">Edit Post</h1>
            </div>

            <PostForm
                mode="update"
                defaultValues={{
                    title: post.title,
                    content: post.content,
                    published: post.published,
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isUpdating}
                postUuid={uuid}
            />
        </div>
    );
}