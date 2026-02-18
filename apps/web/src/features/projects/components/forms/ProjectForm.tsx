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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { api } from "#/lib/api";
import { typeboxResolver } from "#/lib/resolver";
import { ProjectStatus } from "@onlyjs/db/enums";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { projectCreateDto, projectUpdateDto } from "../../schemas";
import type {
    ProjectCreatePayload as CreateFormSchema,
    ProjectUpdatePayload as UpdateFormSchema,
} from "../../types";

// Backend DTO'larından schema'ları al
const projectCreateSchema = projectCreateDto.body;
const projectUpdateSchema = projectUpdateDto.body;

interface ProjectFormPropsBase {
    onCancel: () => void;
    isLoading?: boolean;
    projectUuid?: string;
}

interface ProjectFormPropsCreate extends ProjectFormPropsBase {
    mode: "create";
    defaultValues?: Partial<CreateFormSchema>;
    onSubmit: (data: CreateFormSchema) => Promise<void> | void;
}

interface ProjectFormPropsUpdate extends ProjectFormPropsBase {
    mode: "update";
    defaultValues?: Partial<UpdateFormSchema>;
    onSubmit: (data: UpdateFormSchema) => Promise<void> | void;
}

type ProjectFormProps = ProjectFormPropsCreate | ProjectFormPropsUpdate;

// Status options - Backend ProjectStatus enum'ından
const STATUS_OPTIONS = [
    { value: ProjectStatus.DRAFT, label: "Draft" },
    { value: ProjectStatus.ACTIVE, label: "Active" },
    { value: ProjectStatus.COMPLETED, label: "Completed" },
    { value: ProjectStatus.ARCHIVED, label: "Archived" },
] as const;

export default function ProjectForm({
    mode,
    defaultValues = {},
    onSubmit,
    onCancel,
    isLoading = false,
}: ProjectFormProps) {
    const schema =
        mode === "create" ? projectCreateSchema : projectUpdateSchema;

    // Fetch companies for company selection
    const { data: companiesResponse } = useQuery({
        queryKey: ["companies-list"],
        queryFn: async () => {
            const response = await api.companies.get({
                query: { perPage: 100 },
            });
            return response.data;
        },
    });

    const companies = companiesResponse?.data || [];

    const form = useForm<CreateFormSchema | UpdateFormSchema>({
        resolver: typeboxResolver(schema),
        defaultValues: {
            name: "",
            description: null,
            status: ProjectStatus.DRAFT,
            ...(mode === "create" ? { companyUuid: "" } : {}),
            startDate: null,
            endDate: null,
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
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Website Redesign, Mobile App"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe the project goals and objectives..."
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {mode === "create" && (
                            <FormField
                                control={form.control}
                                name="companyUuid"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a company" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {companies.map((company) => (
                                                    <SelectItem
                                                        key={company.uuid}
                                                        value={company.uuid}
                                                    >
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Select the company this project
                                            belongs to
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={
                                                field.value
                                                    ? typeof field.value ===
                                                      "string"
                                                        ? field.value
                                                        : new Date(field.value)
                                                              .toISOString()
                                                              .split("T")[0]
                                                    : ""
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={
                                                field.value
                                                    ? typeof field.value ===
                                                      "string"
                                                        ? field.value
                                                        : new Date(field.value)
                                                              .toISOString()
                                                              .split("T")[0]
                                                    : ""
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
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
                            ? "Create Project"
                            : "Update Project"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
