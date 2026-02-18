import { Button } from "#/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CompanyForm } from "../components";
import { useCompanies } from "../hooks";
import type { CompanyCreatePayload } from "../types";


export default function CompanyCreatePage() {
    const navigate = useNavigate();
    const { createCompanyAsync, isCreating } = useCompanies();

    const handleSubmit = async (data: CompanyCreatePayload) => {
        // Type guard to check which union type we have
        const payload: CompanyCreatePayload = 'ownerUserId' in data
            ? {
                  name: data.name,
                  ownerUserId: data.ownerUserId,
                  ...(data.logoFileId ? { logoFileId: data.logoFileId } : {}),
              }
            : {
                  name: data.name,
                  createOwner: data.createOwner,
                  ...(data.logoFileId ? { logoFileId: data.logoFileId } : {}),
              };

        await createCompanyAsync(payload);
        // Success toast is shown by the hook
        navigate({ to: "/companies" });
    };

    const handleCancel = () => {
        navigate({ to: "/companies" });
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={handleCancel}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Companies
                </Button>
                <h1 className="text-2xl font-bold">Create New Company</h1>
            </div>

            <CompanyForm
                mode="create"
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isCreating}
            />
        </div>
    );
}
