import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "../components";
import { useProject, useProjects } from "../hooks";
import type { ProjectUpdatePayload } from "../types";


export default function ProjectEditPage() {
    const { uuid } = useParams({
        from: "/_authenticated/projects/$uuid",
    });
    const navigate = useNavigate();

    // Fetch project data
    const { project, isLoading: isProjectLoading } = useProject(uuid);
    const { updateProjectAsync, isUpdating } = useProjects();

    // biome-ignore lint/suspicious/noExplicitAny: Form data type from ProjectForm
    const handleSubmit = async (data: any) => {
        const payload: ProjectUpdatePayload = {
            name: data.name,
            description: data.description?.trim() || null,
            status: data.status,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
        };

        await updateProjectAsync({
            projectUuid: uuid,
            payload,
        });
        // Success toast is shown by the hook
        navigate({ to: "/projects" });
    };

    const handleCancel = () => {
        navigate({ to: "/projects" });
    };

    if (isProjectLoading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The project you are looking for does not exist.
                    </p>
                    <Button onClick={handleCancel}>Back to Projects</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={handleCancel}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Projects
                </Button>
                <h1 className="text-2xl font-bold">Edit Project</h1>
            </div>

            <ProjectForm
                mode="update"
                defaultValues={{
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    startDate: project.startDate ? new Date(project.startDate) : null,
                    endDate: project.endDate ? new Date(project.endDate) : null,
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isUpdating}
                projectUuid={uuid}
            />
        </div>
    );
}
