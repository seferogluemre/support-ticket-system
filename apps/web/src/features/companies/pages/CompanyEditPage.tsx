import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CompanyForm } from "../components";
import { useCompany, useCompanies } from "../hooks";
import type { CompanyUpdatePayload } from "../types";

export default function CompanyEditPage() {
    const { uuid } = useParams({
        from: "/_authenticated/companies/$uuid",
    });
    const navigate = useNavigate();

    // Fetch company data
    const { company, isLoading: isCompanyLoading } = useCompany(uuid);
    const { updateCompanyAsync, isUpdating } = useCompanies();

    const handleSubmit = async (data: CompanyUpdatePayload) => {
        await updateCompanyAsync({
            companyUuid: uuid,
            payload: data,
        });
        // Success toast is shown by the hook
        navigate({ to: "/companies" });
    };

    const handleCancel = () => {
        navigate({ to: "/companies" });
    };

    if (isCompanyLoading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Company Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The company you are looking for does not exist.
                    </p>
                    <Button onClick={handleCancel}>Back to Companies</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={handleCancel}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Companies
                </Button>
                <h1 className="text-2xl font-bold">Edit Company</h1>
            </div>

            <CompanyForm
                mode="update"
                defaultValues={{
                    name: company.name,
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isUpdating}
                companyUuid={uuid}
            />
        </div>
    );
}
