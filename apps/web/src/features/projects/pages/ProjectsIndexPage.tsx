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
import { ProjectStatus } from "@onlyjs/db/enums";
import { useNavigate } from "@tanstack/react-router";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { projectsColumns } from "../columns";
import { useProjects } from "../hooks";
import type { Project } from "../types";

// Status options - Backend ProjectStatus enum'ından
const STATUS_OPTIONS = [
    { value: ProjectStatus.DRAFT, label: "Draft" },
    { value: ProjectStatus.ACTIVE, label: "Active" },
    { value: ProjectStatus.COMPLETED, label: "Completed" },
    { value: ProjectStatus.ARCHIVED, label: "Archived" },
] as const;

export default function ProjectsPage() {
    const navigate = useNavigate();
    const { currentCompany } = useCompanyContext();

    // State for filters
    const [searchKeyword, setSearchKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | undefined>(
        undefined
    );

    // Fetch projects with filters
    const { projects, isLoading, deleteProject, isUpdating, isDeleting } =
        useProjects({
            search: searchKeyword || undefined,
            status: statusFilter,
            companyUuid: currentCompany?.uuid,
        });

    // Handle create project - navigate to create page
    const handleCreateProject = () => {
        navigate({ to: "/projects/create" });
    };

    // Handle edit project - navigate to edit page
    const handleEditProject = (project: Project) => {
        navigate({
            to: "/projects/$uuid",
            params: { uuid: project.uuid },
        });
    };

    // Delete handler
    const handleDeleteProject = (projectUuid: string) => {
        const confirmDelete = confirm(
            "Bu projeyi silmek istediğinizden emin misiniz?"
        );
        if (confirmDelete) {
            deleteProject(projectUuid);
        }
    };

    // Create columns with delete handler
    const columnsWithActions = useMemo(
        () =>
            projectsColumns.map((col) => {
                if (col.id === "actions") {
                    return {
                        ...col,
                        cell: ({ row }: { row: { original: Project } }) => {
                            const project = row.original;
                            return (
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleEditProject(project)
                                        }
                                        disabled={isUpdating}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleDeleteProject(project.uuid)
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
                    <h1 className="text-2xl font-bold">Projects</h1>
                </div>
                <p className="text-muted-foreground">
                    Manage your company projects. Create, update, and track
                    project progress across different companies.
                </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={handleCreateProject}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </Button>

                <div className="flex items-center gap-4">
                    <Select
                        value={statusFilter}
                        onValueChange={(value: ProjectStatus | "all") =>
                            setStatusFilter(value === "all" ? undefined : value)
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
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

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search projects..."
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
                        data={projects || []}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
            </div>
        </PageContainer>
    );
}
