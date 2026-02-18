import { AsyncCombobox, type AsyncComboboxItem } from "#/components/ui/async-combobox";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
import { Textarea } from "#/components/ui/textarea";
import { api } from "#/lib/api";
import { typeboxResolver } from "#/lib/resolver";
import { Gender } from "@onlyjs/db/enums";
import { type Static } from "@sinclair/typebox";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { companyCreateDto, companyUpdateDto } from "../../schemas";

// Backend DTO'larından schema'ları al
const companyCreateSchema = companyCreateDto.body;
const companyUpdateSchema = companyUpdateDto.body;

type CreateFormSchema = Static<typeof companyCreateSchema>;
type UpdateFormSchema = Static<typeof companyUpdateSchema>;

interface CompanyFormPropsBase {
    onCancel: () => void;
    isLoading?: boolean;
    companyUuid?: string;
}

interface CompanyFormPropsCreate extends CompanyFormPropsBase {
    mode: "create";
    defaultValues?: Partial<CreateFormSchema>;
    onSubmit: (data: CreateFormSchema) => Promise<void> | void;
}

interface CompanyFormPropsUpdate extends CompanyFormPropsBase {
    mode: "update";
    defaultValues?: Partial<UpdateFormSchema>;
    onSubmit: (data: UpdateFormSchema) => Promise<void> | void;
}

type CompanyFormProps = CompanyFormPropsCreate | CompanyFormPropsUpdate;

// Gender options - Backend Gender enum'ından
const GENDER_OPTIONS = [
    { value: Gender.MALE, label: "Male" },
    { value: Gender.FEMALE, label: "Female" },
    { value: Gender.NON_BINARY, label: "Non Binary" },
] as const;

export default function CompanyForm({
    mode,
    defaultValues = {},
    onSubmit,
    onCancel,
    isLoading = false,
}: CompanyFormProps) {
    const schema =
        mode === "create" ? companyCreateSchema : companyUpdateSchema;

    // State to track owner creation method
    const [ownerMethod, setOwnerMethod] = useState<"existing" | "new">(
        "existing"
    );

    // Search function for users
    const searchUsers = useCallback(async (query: string): Promise<AsyncComboboxItem[]> => {
        const response = await api.users.get({
            query: { perPage: 20, search: query },
        });
        const users = response.data?.data || [];
        return users.map((user) => ({
            value: user.id,
            label: `${user.name} (${user.email})`,
        }));
    }, []);

    const form = useForm<CreateFormSchema | UpdateFormSchema>({
        resolver: typeboxResolver(schema),
        defaultValues:
            mode === "create"
                ? ({
                      ...defaultValues,
                      name: defaultValues.name || "",
                      logoFileId: defaultValues.logoFileId,
                      ownerUserId: defaultValues.ownerUserId || "",
                  } as CreateFormSchema)
                : ({
                      ...defaultValues,
                      name: defaultValues.name || "",
                      logoFileId: defaultValues.logoFileId,
                  } as UpdateFormSchema),
    });

    const handleFormSubmit = async (
        data: CreateFormSchema | UpdateFormSchema
    ) => {
        if (mode === "create") {
            const createData = data;

            // Validate owner selection
            if (ownerMethod === "existing" && !createData.ownerUserId) {
                form.setError("ownerUserId", {
                    type: "manual",
                    message: "Please select a user",
                });
                return;
            }

            if (ownerMethod === "new") {
                if (!createData.createOwner?.email) {
                    form.setError("createOwner.email", {
                        type: "manual",
                        message: "Email is required",
                    });
                    return;
                }
                if (!createData.createOwner?.password) {
                    form.setError("createOwner.password", {
                        type: "manual",
                        message: "Password is required",
                    });
                    return;
                }
                if (!createData.createOwner?.firstName) {
                    form.setError("createOwner.firstName", {
                        type: "manual",
                        message: "First name is required",
                    });
                    return;
                }
                if (!createData.createOwner?.lastName) {
                    form.setError("createOwner.lastName", {
                        type: "manual",
                        message: "Last name is required",
                    });
                    return;
                }
                if (!createData.createOwner?.gender) {
                    form.setError("createOwner.gender", {
                        type: "manual",
                        message: "Gender is required",
                    });
                    return;
                }
            }
        }

        onSubmit(data);
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
                                    <FormLabel>Company Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Acme Corporation"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name={"email"}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="contact@company.com"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={"phone"}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="tel"
                                                placeholder="+1 234 567 8900"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name={"website"}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Website</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://company.com"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name={"isActive"}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Active</FormLabel>
                                        <FormDescription>
                                            Company is active and can be used
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Owner Information - Only for create mode */}
                {mode === "create" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Owner Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RadioGroup
                                value={ownerMethod}
                                onValueChange={(value) => {
                                    setOwnerMethod(value as "existing" | "new");
                                    if (value === "existing") {
                                        form.setValue("createOwner", undefined);
                                        form.clearErrors("createOwner.email");
                                        form.clearErrors(
                                            "createOwner.password"
                                        );
                                        form.clearErrors(
                                            "createOwner.firstName"
                                        );
                                        form.clearErrors(
                                            "createOwner.lastName"
                                        );
                                        form.clearErrors("createOwner.gender");
                                    } else {
                                        form.setValue("ownerUserId", undefined);
                                        form.clearErrors("ownerUserId");
                                    }
                                }}
                                className="flex flex-col space-y-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="existing"
                                        id="existing"
                                    />
                                    <label
                                        htmlFor="existing"
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Select Existing User
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="new" id="new" />
                                    <label
                                        htmlFor="new"
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Create New Owner
                                    </label>
                                </div>
                            </RadioGroup>

                            {ownerMethod === "existing" ? (
                                <FormField
                                    control={form.control}
                                    name={"ownerUserId"}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Owner User *</FormLabel>
                                            <FormControl>
                                                <AsyncCombobox
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onSearch={searchUsers}
                                                    placeholder="Select a user"
                                                    searchPlaceholder="Search users..."
                                                    emptyMessage="No users found."
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Search and select an existing user to be
                                                the company owner
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={"createOwner.firstName"}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        First Name *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="John"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={"createOwner.lastName"}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Last Name *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Doe"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name={"createOwner.email"}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="owner@company.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={"createOwner.password"}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Password *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Minimum 8 characters
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={"createOwner.gender"}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender *</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        value={field.value}
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        className="flex gap-4"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem
                                                                value={
                                                                    Gender.MALE
                                                                }
                                                                id="male"
                                                            />
                                                            <label
                                                                htmlFor="male"
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                Male
                                                            </label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem
                                                                value={
                                                                    Gender.FEMALE
                                                                }
                                                                id="female"
                                                            />
                                                            <label
                                                                htmlFor="female"
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                Female
                                                            </label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem
                                                                value={
                                                                    Gender.NON_BINARY
                                                                }
                                                                id="non-binary"
                                                            />
                                                            <label
                                                                htmlFor="non-binary"
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                Non Binary
                                                            </label>
                                                        </div>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={"createOwner.isActive"}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Active User
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Owner user account will
                                                        be active
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Address Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Address Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name={"address"}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Street address..."
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name={"city"}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="New York"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={"state"}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State/Province</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="NY"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name={"country"}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="United States"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={"postalCode"}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Postal Code</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="10001"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Legal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Legal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name={"taxId"}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tax ID</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="XX-XXXXXXX"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={"registrationNumber"}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Registration Number
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="REG-XXXXXX"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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
                            ? "Create Company"
                            : "Update Company"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
