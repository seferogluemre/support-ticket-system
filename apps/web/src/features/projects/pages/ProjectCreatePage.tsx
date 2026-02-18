import { Button } from "#/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "../components";
import { useProjects } from "../hooks";
import type { ProjectCreatePayload } from "../types";


export default function ProjectCreatePage() {
    const navigate = useNavigate();
    const { createProjectAsync, isCreating } = useProjects();

    const handleSubmit = async (data: ProjectCreatePayload) => {
        const payload: ProjectCreatePayload = {
            name: data.name,
            description: data.description?.trim() || null,
            status: data.status,
            companyUuid: data.companyUuid,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
        };

        await createProjectAsync(payload);
        // Success toast is shown by the hook
        navigate({ to: "/projects" });
    };

    const handleCancel = () => {
        navigate({ to: "/projects" });
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={handleCancel}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Projects
                </Button>
                <h1 className="text-2xl font-bold">Create New Project</h1>
            </div>

            <ProjectForm
                mode="create"
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isCreating}
            />
        </div>
    );
}
