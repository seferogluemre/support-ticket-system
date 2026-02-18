import { DataTable } from "#/components/data-table";
import { PageContainer } from "#/components/layout/page-container";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "#/components/ui/select";
import { useCompanyContext } from "#/context/company-context";
import { useSidebarType } from "#/hooks/use-sidebar-type";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { companiesColumns } from "../columns";
import { useCompanies } from "../hooks";
import type { Company } from "../types";

export default function CompaniesPage() {
    const navigate = useNavigate();
    const { setCurrentCompany } = useCompanyContext();
    const { setSidebarType } = useSidebarType();

    // State for filters
    const [searchKeyword, setSearchKeyword] = useState("");
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Fetch companies with filters
    const {
        companies,
        isLoading,
        deleteCompany,
        isUpdating,
        isDeleting,
    } = useCompanies({
        search: searchKeyword || undefined,
        sortBy: sortBy,
        sortOrder,
    });

    // Handle create company - navigate to create page
    const handleCreateCompany = () => {
        navigate({ to: "/companies/create" });
    };

    // Handle edit company - navigate to edit page
    const handleEditCompany = (company: Company) => {
        navigate({
            to: "/companies/$uuid",
            params: { uuid: company.uuid },
        });
    };

    // Delete handler
    const handleDeleteCompany = (companyUuid: string) => {
        const confirmDelete = confirm(
            "Bu şirketi silmek istediğinizden emin misiniz?"
        );
        if (confirmDelete) {
            deleteCompany(companyUuid);
        }
    };

    // Go to company handler - sets company and switches sidebar
    const handleGoToCompany = (company: Company) => {
        // Set the company in context (this will also update sessionStorage)
        setCurrentCompany(company);
        // Switch to company sidebar
        setSidebarType('company');
        // Navigate to dashboard page
        navigate({ to: '/' });
    };

    // Create columns with delete handler
    const columnsWithActions = useMemo(
        () =>
            companiesColumns.map((col) => {
                if (col.id === "actions") {
                    return {
                        ...col,
                        cell: ({ row }: { row: { original: Company } }) => {
                            const company = row.original;
                            return (
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleGoToCompany(company)
                                        }
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Company'ye Git"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleEditCompany(company)
                                        }
                                        disabled={isUpdating}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleDeleteCompany(company.uuid)
                                        }
                                        className="text-red-600 hover:text-red-800"
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        },
                    };
                }
                return col;
            }),
        [isUpdating, isDeleting]
    );

    return (
        <PageContainer>
            <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Companies</h1>
                </div>
                <p className="text-muted-foreground">
                    Manage your companies. Create, update, and track company information
                    and their owners.
                </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={handleCreateCompany}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Company
                </Button>

                <div className="flex items-center gap-4">
                    <Select
                        value={sortBy}
                        onValueChange={(value) =>
                            setSortBy(value === "none" ? undefined : value)
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No sorting</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="createdAt">Created Date</SelectItem>
                            <SelectItem value="updatedAt">Updated Date</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={sortOrder}
                        onValueChange={(value: "asc" | "desc") =>
                            setSortOrder(value)
                        }
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search companies..."
                            className="pl-9 w-80"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <DataTable
                        columns={columnsWithActions}
                        data={companies || []}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
            </div>
        </PageContainer>
    );
}
