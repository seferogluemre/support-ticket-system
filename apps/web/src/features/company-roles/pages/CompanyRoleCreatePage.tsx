import { Button } from "#/components/ui/button";
import { useCompanyContext } from "#/context/company-context";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import RoleForm from "../components/forms/CompanyRoleForm";
import { useCompanyRoles } from "../hooks";
import type { CompanyRoleCreatePayload } from "../types";

interface CompanyRoleCreatePageProps {
    companyUuid?: string;
}

export default function CompanyRoleCreatePage({ companyUuid: propCompanyUuid }: CompanyRoleCreatePageProps) {
    // Get company from context or prop
    const { currentCompany } = useCompanyContext();
    const companyUuid = propCompanyUuid ?? currentCompany?.uuid;

    if (!companyUuid) {
        throw new Error('No company selected');
    }

    const navigate = useNavigate();
    const { createCompanyRoleAsync, isCreating } = useCompanyRoles(companyUuid, {});

    const handleSubmit = async (data: CompanyRoleCreatePayload) => {
        try {
            await createCompanyRoleAsync(data);
            // Success toast is shown by the hook
            navigate({
                to: "/company-roles"
            });
        } catch (error) {
            console.error("Failed to create company role:", error);
            // Don't show generic error toast - backend error message is already shown
            throw error; // Re-throw to let form handle it
        }
    };

    const handleCancel = () => {
        navigate({
            to: "/company-roles"
        });
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={handleCancel}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Roles
                </Button>
                <h1 className="text-2xl font-bold">Create New Company Role</h1>
            </div>

            <RoleForm
                mode="create"
                companyUuid={companyUuid}
                defaultValues={{
                    name: "",
                    description: "",
                    permissions: [],
                    order: 0,
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isCreating}
            />
        </div>
    );
}
