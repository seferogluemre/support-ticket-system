import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useCompanyContext } from "#/context/company-context";
import type { CompanyRoleUpdatePayload } from "../types";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import RoleForm from "../components/forms/CompanyRoleForm";
import { useCompanyRole, useCompanyRoles } from "../hooks";

interface CompanyRoleEditPageProps {
    companyUuid?: string;
}

export default function CompanyRoleEditPage({ companyUuid: propCompanyUuid }: CompanyRoleEditPageProps) {
    // Get company from context or prop
    const { currentCompany } = useCompanyContext();
    const companyUuid = propCompanyUuid ?? currentCompany?.uuid;

    if (!companyUuid) {
        throw new Error('No company selected');
    }

    const { uuid } = useParams({
        from: "/_authenticated/company-roles/$uuid",
    });
    const navigate = useNavigate();

    // Fetch role data
    const { companyRole, isLoading: isRoleLoading } = useCompanyRole(uuid);
    const { updateCompanyRoleAsync, isUpdating } = useCompanyRoles(companyUuid, {});

    const handleSubmit = async (data: CompanyRoleUpdatePayload) => {
        try {
            // Convert empty string description to null
            const payload: CompanyRoleUpdatePayload = {
                ...data,
                description: data.description?.trim() || null,
            };

            // Remove order from payload if it's a system role (BASIC/ADMIN)
            const isSystemRole = companyRole?.type === "BASIC" || companyRole?.type === "ADMIN";
            if (isSystemRole) {
                // System roles can only update: name, description, permissions
                delete payload.order;
            }

            await updateCompanyRoleAsync({
                uuid,
                payload,
            });
            // Success toast is shown by the hook
            navigate({
                to: "/company-roles"
            });
        } catch (error) {
            console.error("Failed to update company role:", error);
            // Don't show generic error toast - backend error message is already shown
            throw error; // Re-throw to let form handle it
        }
    };

    const handleCancel = () => {
        navigate({
            to: "/company-roles"
        });
    };

    if (isRoleLoading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <div className="flex justify-end space-x-3">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>
            </div>
        );
    }

    if (!companyRole) {
        return (
            <div className="container mx-auto p-6 max-w-4xl text-center text-muted-foreground">
                Company role not found.
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={handleCancel}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Roles
                </Button>
                <h1 className="text-2xl font-bold">Edit Company Role: {companyRole.name}</h1>
            </div>

            <RoleForm
                mode="update"
                companyUuid={companyUuid}
                defaultValues={{
                    name: companyRole.name,
                    description: companyRole.description || "",
                    permissions: Array.isArray(companyRole.permissions)
                        ? companyRole.permissions
                        : [],
                    order: companyRole.order || 0,
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isUpdating}
                roleUuid={uuid}
                roleType={companyRole.type}
            />
        </div>
    );
}
