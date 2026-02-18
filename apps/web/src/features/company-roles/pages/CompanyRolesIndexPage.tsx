import { DataTable } from "#/components/data-table";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "#/components/ui/accordion";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "#/components/ui/sheet";
import { useCompanyContext } from "#/context/company-context";
import { CheckCircle2, Edit, Plus, Search, Settings, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { companyRolesColumns } from "../columns";
import { useCompanyRoleMembers, useCompanyRoles } from "../hooks";
import { companyPermissionGroupsQueryOptions } from "../queries";
import { type CompanyRole } from "../types";

interface CompanyRolesIndexPageProps {
    companyUuid?: string;
}

export default function CompanyRolesIndexPage({ companyUuid: propCompanyUuid }: CompanyRolesIndexPageProps) {
    // Get company from context or prop
    const { currentCompany } = useCompanyContext();
    const companyUuid = propCompanyUuid ?? currentCompany?.uuid;

    if (!companyUuid) {
        throw new Error('No company selected');
    }

    const navigate = useNavigate();

    // Roles data - filtered by company
    const {
        companyRoles: rolesData,
        isLoading,
        deleteCompanyRoleAsync,
    } = useCompanyRoles(companyUuid, {});

    // State management
    const [searchKeyword, setSearchKeyword] = useState("");

    // Permission sheet state
    const [selectedRole, setSelectedRole] = useState<CompanyRole | null>(null);
    const [isPermissionSheetOpen, setIsPermissionSheetOpen] = useState(false);

    // Members modal state
    const [selectedRoleUuid, setSelectedRoleUuid] = useState<string | null>(
        null
    );
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    // Fetch permission groups for drawer
    const { data: permissionGroups } = useQuery({
        ...companyPermissionGroupsQueryOptions(),
        enabled: isPermissionSheetOpen,
    });

    // Fetch role members when modal opens (only if modal is open)
    const { members: roleMembers, isLoading: isMembersLoading } =
        useCompanyRoleMembers(selectedRoleUuid || "");

    // Get member preview from the selected role (for optimistic UI)
    const selectedRoleData = rolesData?.find(
        (r) => r.uuid === selectedRoleUuid
    );
    const memberPreview = selectedRoleData?.memberPreview || [];

    // Filter roles based on search
    const filteredRoles = useMemo(() => {
        if (!rolesData) return [];
        if (!searchKeyword.trim()) return rolesData;

        const keyword = searchKeyword.toLowerCase();
        return rolesData.filter(
            (role) =>
                role.name.toLowerCase().includes(keyword) ||
                (role.description &&
                    role.description.toLowerCase().includes(keyword))
        );
    }, [rolesData, searchKeyword]);

    // Handle create role - navigate to create page
    const handleCreateRole = () => {
        navigate({
            to: "/company-roles/create"
        });
    };

    // Handle edit role - navigate to edit page
    const handleEditRole = (role: CompanyRole) => {
        navigate({
            to: "/company-roles/$uuid",
            params: { uuid: role.uuid }
        });
    };

    // Handle role deletion
    const handleDeleteRole = (roleUuid: string) => {
        const role = rolesData?.find((r) => r.uuid === roleUuid);
        if (!role) return;

        // System roles cannot be deleted
        if (role.type === "BASIC" || role.type === "ADMIN") {
            alert("System roles cannot be deleted");
            return;
        }

        const confirmDelete = confirm(
            `Are you sure you want to delete the role "${role.name}"?`
        );
        if (confirmDelete) {
            try {
                deleteCompanyRoleAsync(roleUuid);
            } catch (error) {
                console.error("Failed to delete company role:", error);
            }
        }
    };

    // Handle view permissions
    const handleViewPermissions = (role: CompanyRole) => {
        setSelectedRole(role);
        setIsPermissionSheetOpen(true);
    };

    // Handle view members
    const handleViewMembers = (roleUuid: string) => {
        setSelectedRoleUuid(roleUuid);
        setIsMembersModalOpen(true);
    };

    // Update columns to include delete handler and click handlers while preserving original design
    const updatedColumns = companyRolesColumns.map((col) => {
        // biome-ignore lint/suspicious/noExplicitAny: Column type checking
        if ((col as any).id === "members") {
            return {
                ...col,
                // biome-ignore lint/suspicious/noExplicitAny: Row type from react-table
                cell: ({ row }: any) => {
                    const role = row.original;
                    const memberCount = role.memberCount || 0;
                    const originalCell = col.cell;

                    // Original cell'i render et
                    const cellContent =
                        typeof originalCell === "function"
                            ? // biome-ignore lint/suspicious/noExplicitAny: Cell rendering with react-table context
                              originalCell({ row } as any)
                            : null;

                    // Eğer member yoksa tıklanabilir yapma
                    if (memberCount === 0) {
                        return cellContent;
                    }

                    return (
                        <div onClick={() => handleViewMembers(role.uuid)}>
                            {cellContent}
                        </div>
                    );
                },
            };
        }

        // biome-ignore lint/suspicious/noExplicitAny: Column type checking
        if ((col as any).accessorKey === "permissions") {
            return {
                ...col,
                // biome-ignore lint/suspicious/noExplicitAny: Row type from react-table
                cell: ({ row }: any) => {
                    const role = row.original;
                    return (
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => handleViewPermissions(role)}
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    );
                },
            };
        }

        // biome-ignore lint/suspicious/noExplicitAny: Column type checking
        if ((col as any).id === "actions") {
            return {
                ...col,
                // biome-ignore lint/suspicious/noExplicitAny: Row type from react-table
                cell: ({ row }: any) => {
                    const role = row.original;
                    const isSystemRole = role.type === "BASIC" || role.type === "ADMIN";
                    return (
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => handleEditRole(role)}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => handleDeleteRole(role.uuid)}
                                disabled={isSystemRole}
                                title={isSystemRole ? "System roles cannot be deleted" : "Delete role"}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    );
                },
            };
        }

        return col;
    });

    return (
        <div className="container mx-auto p-6">
            <div className="flex flex-col space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold">Company Roles</h1>
                    <Button
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={handleCreateRole}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Role
                    </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search roles..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Data Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">
                        Loading roles...
                    </div>
                </div>
            ) : (
                <DataTable columns={updatedColumns} data={filteredRoles} />
            )}

            {/* Permission Sheet */}
            <Sheet
                open={isPermissionSheetOpen}
                onOpenChange={setIsPermissionSheetOpen}
            >
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="px-6 pb-4 sticky top-0 bg-background z-10 border-b">
                        <SheetTitle>
                            {selectedRole?.name} - Permissions
                        </SheetTitle>
                        <SheetDescription>
                            {selectedRole?.description}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 px-6 pb-6">
                        {/* Global Wildcard Badge */}
                        {selectedRole?.permissions.includes("*") && (
                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                                        🌟 All Permissions (Global Wildcard)
                                    </span>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                                    This role has access to all permissions in the system
                                </p>
                            </div>
                        )}

                        {/* Permission Groups */}
                        {!selectedRole?.permissions.includes("*") && permissionGroups && (
                            <Accordion type="multiple" className="w-full">
                                {Object.entries(permissionGroups).map(([groupKey, group]) => {
                                    const hasGroupWildcard = selectedRole?.permissions.includes(`${groupKey}:*`);
                                    const assignedPermissions = group.permissions.filter((p: { key: string }) =>
                                        selectedRole?.permissions.includes(p.key)
                                    );
                                    const hasAnyPermission = hasGroupWildcard || assignedPermissions.length > 0;

                                    return (
                                        <AccordionItem key={groupKey} value={groupKey}>
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center justify-between w-full pr-4">
                                                    <span className="font-medium text-sm">
                                                        {group.description}
                                                    </span>
                                                    <div className="flex items-center space-x-2">
                                                        {hasGroupWildcard ? (
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
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                {hasGroupWildcard ? (
                                                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm text-blue-700 dark:text-blue-300">
                                                        ✓ All permissions in this group ({groupKey}:*)
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {group.permissions.map((permission: { key: string; description: string }) => {
                                                            const isAssigned = selectedRole?.permissions.includes(permission.key);
                                                            return (
                                                                <div
                                                                    key={permission.key}
                                                                    className={`flex items-start space-x-3 p-3 rounded ${
                                                                        isAssigned
                                                                            ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                                                                            : "bg-gray-50 dark:bg-gray-900 opacity-50"
                                                                    }`}
                                                                >
                                                                    {isAssigned ? (
                                                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                                    ) : (
                                                                        <div className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                                                    )}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={`text-sm font-medium ${!isAssigned && "text-gray-500"}`}>
                                                                            {permission.description}
                                                                        </div>
                                                                        <div className={`text-xs mt-1 font-mono ${
                                                                            isAssigned ? "text-muted-foreground" : "text-gray-400"
                                                                        }`}>
                                                                            {permission.key}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        )}

                        {/* No permissions */}
                        {!selectedRole?.permissions.includes("*") &&
                            selectedRole?.permissions.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No permissions assigned to this role
                                </div>
                            )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Members Modal */}
            <Dialog
                open={isMembersModalOpen}
                onOpenChange={(open) => {
                    setIsMembersModalOpen(open);
                    if (!open) {
                        setSelectedRoleUuid(null);
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Role Members</DialogTitle>
                        <DialogDescription>
                            All members assigned to this role
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                        {isMembersLoading && memberPreview.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                Loading members...
                            </div>
                        ) : (
                            <>
                                {/* Önce full member listesini göster (eğer yüklendiyse) */}
                                {roleMembers && roleMembers.length > 0 ? (
                                    roleMembers.map((member) => (
                                        <div
                                            key={member.uuid}
                                            className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded"
                                        >
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback className="bg-blue-500 text-white">
                                                    {member.name
                                                        .split(" ")
                                                        .map(
                                                            (n: string) => n[0]
                                                        )
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {member.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {member.email}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : memberPreview.length > 0 ? (
                                    /* Eğer full list yüklenmediyse preview'i göster */
                                    <>
                                        {memberPreview.map((member) => (
                                            <div
                                                key={member.uuid}
                                                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded opacity-70"
                                            >
                                                <Avatar className="w-10 h-10">
                                                    <AvatarFallback className="bg-blue-500 text-white">
                                                        {member.name
                                                            .split(" ")
                                                            .map(
                                                                (n: string) =>
                                                                    n[0]
                                                            )
                                                            .join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {member.name}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {isMembersLoading && (
                                            <div className="text-center text-muted-foreground text-sm py-4">
                                                Loading more members...
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
                                        No members assigned
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            </div>
        </div>
    );
}
