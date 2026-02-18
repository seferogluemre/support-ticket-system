import { Button } from "#/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PostForm } from "../components";
import { usePosts } from "../hooks";
import type { PostCreatePayload } from "../types";


export default function PostCreatePage() {
    const navigate = useNavigate();
    const { createPostAsync, isCreating } = usePosts();

    const handleSubmit = async (data: PostCreatePayload) => {
        const payload: PostCreatePayload = {
            title: data.title,
            content: data.content,
            published: data.published,
        };

        await createPostAsync(payload);
        // Success toast is shown by the hook
        navigate({ to: "/posts" });
    };

    const handleCancel = () => {
        navigate({ to: "/posts" });
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={handleCancel}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Posts
                </Button>
                <h1 className="text-2xl font-bold">Create New Post</h1>
            </div>

            <PostForm
                mode="create"
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isCreating}
            />
        </div>
    );
}