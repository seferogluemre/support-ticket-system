import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { typeboxResolver } from "#/lib/resolver";
import { useForm } from "react-hook-form";
import { postCreateDto, postUpdateDto } from "../../schemas";
import type {
    PostCreatePayload as CreateFormSchema,
    PostUpdatePayload as UpdateFormSchema,
} from "../../types";

// Backend DTO'larından schema'ları al
const postCreateSchema = postCreateDto.body;
const postUpdateSchema = postUpdateDto.body;

interface PostFormPropsBase {
    onCancel: () => void;
    isLoading?: boolean;
    postUuid?: string;
}

interface PostFormPropsCreate extends PostFormPropsBase {
    mode: "create";
    defaultValues?: Partial<CreateFormSchema>;
    onSubmit: (data: CreateFormSchema) => Promise<void> | void;
}

interface PostFormPropsUpdate extends PostFormPropsBase {
    mode: "update";
    defaultValues?: Partial<UpdateFormSchema>;
    onSubmit: (data: UpdateFormSchema) => Promise<void> | void;
}

type PostFormProps = PostFormPropsCreate | PostFormPropsUpdate;

export default function PostForm({
    mode,
    defaultValues = {},
    onSubmit,
    onCancel,
    isLoading = false,
}: PostFormProps) {
    const schema =
        mode === "create" ? postCreateSchema : postUpdateSchema;

    const form = useForm<CreateFormSchema | UpdateFormSchema>({
        resolver: typeboxResolver(schema),
        defaultValues: {
            title: "",
            content: "",
            published: false,
            ...defaultValues,
        } as any,
    });

    const handleFormSubmit = async (data: CreateFormSchema | UpdateFormSchema) => {
        try {
            if (mode === "create") {
                await (onSubmit as (data: CreateFormSchema) => Promise<void> | void)(data as CreateFormSchema);
            } else {
                await (onSubmit as (data: UpdateFormSchema) => Promise<void> | void)(data as UpdateFormSchema);
            }
        } catch (error) {
            console.error("Form submission error:", error);
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-6"
            >
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Post Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., My First Blog Post"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Write your post content here..."
                                            className="min-h-[200px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="published"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Published
                                        </FormLabel>
                                        <FormDescription>
                                            Make this post visible to the public
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || form.formState.isSubmitting}
                    >
                        {isLoading || form.formState.isSubmitting
                            ? mode === "create"
                                ? "Creating..."
                                : "Updating..."
                            : mode === "create"
                            ? "Create Post"
                            : "Update Post"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}