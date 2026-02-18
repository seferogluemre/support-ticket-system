import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "#/components/ui/accordion";
import { Badge } from "#/components/ui/badge";
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
import { NumberInput } from "#/components/number-input";
import { Textarea } from "#/components/ui/textarea";
import { TransferList } from "#/components/ui/transfer-list";
import { useCompany } from "#/features/companies";
import { api } from "#/lib/api";
import { typeboxResolver } from "#/lib/resolver";
import { OrganizationType } from "#/types/api";
import type { PermissionKey } from "#backend/modules/auth/authorization/permissions/types.ts";
import { type Static } from "@sinclair/typebox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { companyPermissionGroupsQueryOptions } from "../../queries/permission-queries";
import { companyRoleCreateDto, companyRoleUpdateDto } from "../../schemas";

type CreateFormSchema = Static<typeof companyRoleCreateDto>;
type UpdateFormSchema = Static<typeof companyRoleUpdateDto>;

interface CompanyRoleFormProps {
    mode: "create" | "update";
    companyUuid: string;
    defaultValues?: Partial<CreateFormSchema | UpdateFormSchema>;
    onSubmit: (
        data: CreateFormSchema | UpdateFormSchema
    ) => Promise<void> | void;
    onCancel: () => void;
    isLoading?: boolean;
    roleUuid?: string; // For fetching members in update mode
    roleType?: "BASIC" | "ADMIN" | "CUSTOM"; // Role type for determining if order is editable
}

export default function CompanyRoleForm({
    mode,
    companyUuid,
    defaultValues = {},
    onSubmit,
    onCancel,
    isLoading = false,
    roleUuid,
    roleType,
}: CompanyRoleFormProps) {
    const { company } = useCompany(companyUuid);
    const queryClient = useQueryClient();
    const schema = mode === "create" ? companyRoleCreateDto : companyRoleUpdateDto;
    const [selectedMembers, setSelectedMembers] = useState<
        Array<{ userId: string; name: string; email: string }>
    >([]);

    // Fetch role members if in update mode
    const { data: membersData } = useQuery({
        queryKey: ["role-members", roleUuid],
        queryFn: async () => {
            if (!roleUuid) return null;
            const response = await api.auth
                .roles({ uuid: roleUuid })
                .members.get();
            if (response.error) throw response.error;
            return response.data;
        },
        enabled: mode === "update" && !!roleUuid,
    });

    const members = membersData || [];

    // Track which roleUuid we've initialized for
    const initializedRoleRef = useRef<string | null>(null);

    // Sync selected members with fetched data - only once per roleUuid
    useEffect(() => {
        // Only sync if:
        // 1. We have members data
        // 2. We haven't initialized for this roleUuid yet
        // 3. roleUuid exists
        if (
            members.length > 0 &&
            roleUuid &&
            initializedRoleRef.current !== roleUuid
        ) {
            setSelectedMembers(
                members.map(
                    (m: { uuid: string; name: string; email: string }) => ({
                        userId: m.uuid,
                        name: m.name,
                        email: m.email,
                    })
                )
            );
            initializedRoleRef.current = roleUuid;
        }
    }, [members, roleUuid]);

    // Reset when roleUuid changes (new role opened)
    useEffect(() => {
        if (initializedRoleRef.current !== roleUuid) {
            setSelectedMembers([]);
            initializedRoleRef.current = null;
        }
    }, [roleUuid]);

    // Fetch available users (company members) for adding
    const { data: usersData } = useQuery({
        queryKey: ["company-members", companyUuid],
        queryFn: async () => {
            if (!companyUuid) return null;
            const response = await api.auth.organizations
                .company({ organizationUuid: companyUuid })
                .members.get();
            if (response.error) throw response.error;
            return response.data;
        },
        enabled: mode === "update" && !!companyUuid && !!roleUuid,
    });

    const allUsers = Array.isArray(usersData) ? usersData : [];

    // Sync members mutation (bulk update)
    const syncMembersMutation = useMutation({
        mutationFn: async (userIds: string[]) => {
            if (!roleUuid) throw new Error("Role UUID is required");
            const response = await api.auth
                .roles({ uuid: roleUuid })
                .members["sync"].put({
                    userIds,
                });
            if (response.error) throw response.error;
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate role members query
            queryClient.invalidateQueries({
                queryKey: ["role-members", roleUuid],
            });
            // Invalidate roles list (for memberPreview update)
            queryClient.invalidateQueries({
                queryKey: ["company-roles", companyUuid],
            });
            // Invalidate specific role query
            queryClient.invalidateQueries({
                queryKey: ["role", roleUuid],
            });
            // Reset initialization ref so fresh data from server is loaded
            initializedRoleRef.current = null;
            toast.success(data?.message || "Member listesi güncellendi");
        },
        onError: () => {
            toast.error("Member listesi güncellenirken bir hata oluştu");
        },
    });

const handleMembersChange = (
    newMembers: Array<{ id: string; label: string }>
) => {
    setSelectedMembers(
        newMembers.map((m) => {
            const user = allUsers.find((u) => u.userId === m.id);
            return {
                userId: m.id,
                name: user?.name || m.label,
                email: user?.email || "",
            };
        })
    );
};

    // Check if members have changed
    const membersChanged = () => {
        if (mode !== "update" || !roleUuid) return false;

        const currentMemberIds = new Set(
            members.map((m: { uuid: string }) => m.uuid)
        );
        const selectedMemberIds = new Set(selectedMembers.map((m) => m.userId));

        // Check if counts are different
        if (currentMemberIds.size !== selectedMemberIds.size) return true;

        // Check if any member is different
        for (const id of selectedMemberIds) {
            if (!currentMemberIds.has(id)) return true;
        }

        return false;
    };

    // Enhanced submit handler
    const handleFormSubmit = async (
        data: CreateFormSchema | UpdateFormSchema
    ) => {
        try {
            // 1. Save role data first
            await onSubmit(data);

            // 2. If in update mode and members changed, sync members
            if (mode === "update" && roleUuid && membersChanged()) {
                const userIds = selectedMembers.map((m) => m.userId);
                await syncMembersMutation.mutateAsync(userIds);
            }
        } catch (error) {
            // Error handling is done in parent component
            console.error("Form submission error:", error);
        }
    };

    // Fetch permission groups for better organization
    const { data: permissionGroups, isLoading: groupsLoading } = useQuery(
        companyPermissionGroupsQueryOptions()
    );

    const isLoadingPermissions = groupsLoading;

    const form = useForm<CreateFormSchema | UpdateFormSchema>({
        resolver: typeboxResolver(schema),
        defaultValues: mode === "create"
            ? {
                name: "",
                description: "",
                permissions: [],
                organizationType: OrganizationType.COMPANY,
                organizationUuid: companyUuid || undefined,
                order: 0,
                ...defaultValues,
            }
            : {
                name: "",
                description: "",
                permissions: [],
                order: 0,
                ...defaultValues,
            },
    });

    const selectedPermissions = form.watch("permissions");
    const hasAllPermissions = selectedPermissions?.includes("*");

    const handlePermissionToggle = (permission: string) => {
        const current = (form.getValues("permissions") as string[]) || [];

        if (permission === "*") {
            // If selecting "All Permissions", clear others and set only "*"
            form.setValue("permissions", ["*"] as ["*"]);
        } else {
            // Remove "*" if present and toggle the specific permission
            const withoutAll = current.filter((p) => p !== "*");
            if (withoutAll.includes(permission)) {
                const updated = withoutAll.filter((p) => p !== permission);
                form.setValue(
                    "permissions",
                    updated.length > 0
                        ? (updated as PermissionKey[])
                        : ([] as PermissionKey[])
                );
            } else {
                form.setValue("permissions", [
                    ...withoutAll,
                    permission,
                ] as PermissionKey[]);
            }
        }
    };

    const handleGroupWildcardToggle = (groupKey: string) => {
        const wildcardKey = `${groupKey}:*`;
        const current = (form.getValues("permissions") as string[]) || [];

        if (current.includes(wildcardKey)) {
            // Remove group wildcard
            form.setValue(
                "permissions",
                current.filter((p) => p !== wildcardKey) as PermissionKey[]
            );
        } else {
            // Add group wildcard and remove individual permissions from this group
            const groupPermissions =
                permissionGroups?.[groupKey]?.permissions.map(
                    (p: { key: string }) => p.key
                ) || [];
            form.setValue("permissions", [
                ...current.filter(
                    (p) => p !== "*" && !groupPermissions.includes(p)
                ),
                wildcardKey,
            ] as PermissionKey[]);
        }
    };

    const isGroupWildcardSelected = (groupKey: string) => {
        const current = (form.getValues("permissions") as string[]) || [];
        return current.includes(`${groupKey}:*`);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="flex flex-col space-y-6 p-6"
            >
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">
                        {mode === "create" ? "New Company Role" : "Edit Company Role"}
                    </h1>
                    {company && (
                        <p className="text-sm text-muted-foreground">
                            {company.name}
                        </p>
                    )}
                </div>

                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Support Agent"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        A descriptive name for this role
                                    </FormDescription>
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
                                            rows={3}
                                            placeholder="Describe the purpose of this role"
                                            {...field}
                                            value={field.value || ""}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Optional description of the role's
                                        responsibilities
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="order"
                            render={({ field }) => {
                                const isSystemRole = roleType === "BASIC" || roleType === "ADMIN";
                                return (
                                    <FormItem>
                                        <FormLabel>Order (Hierarchy)</FormLabel>
                                        <FormControl>
                                            <NumberInput
                                                min={0}
                                                max={1000}
                                                value={field.value || 0}
                                                onChange={field.onChange}
                                                disabled={isLoading || isSystemRole}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {isSystemRole 
                                                ? "Default System roles (BASIC/ADMIN) hierarchy values cannot be changed"
                                                : "Higher numbers = more powerful role"
                                            }
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Permissions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="permissions"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Select Permissions *</FormLabel>

                                    {/* Global Wildcard */}
                                    <Card className="border-2 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 mt-4">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start space-x-3">
                                                <Checkbox
                                                    id="wildcard-global"
                                                    checked={hasAllPermissions}
                                                    onCheckedChange={() =>
                                                        handlePermissionToggle(
                                                            "*"
                                                        )
                                                    }
                                                    disabled={isLoading}
                                                />
                                                <div className="grid gap-1 leading-none flex-1">
                                                    <label
                                                        htmlFor="wildcard-global"
                                                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-blue-700 dark:text-blue-300"
                                                    >
                                                        🌟 Tüm Yetkiler (Global
                                                        Wildcard)
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Bu seçenek rolü tüm
                                                        yetkilerle donatır.
                                                        Sadece admin rolleri
                                                        için önerilir. (*)
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {isLoadingPermissions ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            <span className="ml-2 text-sm text-muted-foreground">
                                                Loading permissions...
                                            </span>
                                        </div>
                                    ) : permissionGroups ? (
                                        <Accordion
                                            type="multiple"
                                            className="w-full mt-4"
                                        >
                                            {Object.entries(
                                                permissionGroups
                                            ).map(([_groupName, group]) => {
                                                const groupKey = group.key; // Use group.key from API response
                                                const hasGroupWildcard = isGroupWildcardSelected(groupKey);
                                                const assignedPermissions = group.permissions.filter(
                                                    (p: { key: string }) =>
                                                        (selectedPermissions as string[])?.includes(p.key)
                                                );
                                                const hasAnyPermission = hasGroupWildcard || assignedPermissions.length > 0;
                                                
                                                return (
                                                <AccordionItem
                                                    key={groupKey}
                                                    value={groupKey}
                                                >
                                                    <AccordionTrigger className="hover:no-underline">
                                                        <div className="flex items-center justify-between w-full pr-4">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-medium text-sm">
                                                                    {
                                                                        group.description
                                                                    }
                                                                </span>
                                                                {/* Permission count badge */}
                                                                {hasAllPermissions ? (
                                                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                                                        All
                                                                    </Badge>
                                                                ) : hasGroupWildcard ? (
                                                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                                                        All
                                                                    </Badge>
                                                                ) : hasAnyPermission ? (
                                                                    <Badge variant="default" className="text-xs bg-green-600">
                                                                        {assignedPermissions.length}/{group.permissions.length}
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-xs text-gray-500">
                                                                        0/{group.permissions.length}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div
                                                                className="flex items-center space-x-2 text-xs"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <Checkbox
                                                                    id={`wildcard-${groupKey}`}
                                                                    checked={hasGroupWildcard}
                                                                    onCheckedChange={() =>
                                                                        handleGroupWildcardToggle(
                                                                            groupKey
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isLoading ||
                                                                        hasAllPermissions
                                                                    }
                                                                />
                                                                <label
                                                                    htmlFor={`wildcard-${groupKey}`}
                                                                    className="font-medium text-muted-foreground cursor-pointer"
                                                                >
                                                                    Tümü
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="grid gap-3 pt-2 pb-4 px-1">
                                                            {group.permissions.map(
                                                                (permission: {
                                                                    key: string;
                                                                    description: string;
                                                                }) => {
                                                                    const isDisabledByWildcard =
                                                                        hasAllPermissions ||
                                                                        isGroupWildcardSelected(
                                                                            groupKey
                                                                        );
                                                                    return (
                                                                        <div
                                                                            key={
                                                                                permission.key
                                                                            }
                                                                            className="flex items-start space-x-3"
                                                                        >
                                                                            <Checkbox
                                                                                id={
                                                                                    permission.key
                                                                                }
                                                                                checked={
                                                                                    isDisabledByWildcard ||
                                                                                    (
                                                                                        selectedPermissions as string[]
                                                                                    )?.includes(
                                                                                        permission.key
                                                                                    )
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    handlePermissionToggle(
                                                                                        permission.key
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    isLoading ||
                                                                                    isDisabledByWildcard
                                                                                }
                                                                            />
                                                                            <div className="grid gap-1 leading-none">
                                                                                <label
                                                                                    htmlFor={
                                                                                        permission.key
                                                                                    }
                                                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                                                >
                                                                                    {
                                                                                        permission.description
                                                                                    }
                                                                                </label>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {
                                                                                        permission.key
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                );
                                            })}
                                        </Accordion>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No permissions available
                                        </p>
                                    )}

                                    <FormDescription>
                                        Select at least one permission. "All
                                        Permissions" grants full access.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Members Section (Update Mode Only) */}
                {mode === "update" && roleUuid && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Members Management</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <TransferList
                               available={allUsers.map(
                                   (user: {
                                       userId: string;
                                       name: string;
                                       email: string;
                                   }) => ({
                                       id: user.userId,
                                       label: user.name,
                                       sublabel: user.email,
                                   })
                               )}
                                selected={selectedMembers.map((m) => ({
                                    id: m.userId,
                                    label: m.name,
                                    sublabel: m.email,
                                }))}
                                onChange={handleMembersChange}
                                availableTitle="Available Users"
                                selectedTitle="Role Members"
                                searchPlaceholder="Search users..."
                                disabled={
                                    isLoading || syncMembersMutation.isPending
                                }
                            />
                            {membersChanged() && (
                                <p className="text-sm text-muted-foreground">
                                    💡 Member değişiklikleri form
                                    kaydedildiğinde uygulanacak
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading || syncMembersMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || syncMembersMutation.isPending}
                    >
                        {isLoading || syncMembersMutation.isPending
                            ? "Saving..."
                            : mode === "create"
                              ? "Create Company Role"
                              : "Update Company Role"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
