import { useEntityFormDialog } from "#hooks/use-entity-form-dialog.tsx";
import { CompanyMemberForm } from "../components/forms";

export interface CompanyMemberFormData {
    memberId?: string;
    companyUuid: string;
    initialEmail?: string;
    initialFirstName?: string;
    initialLastName?: string;
    initialGender?: 'MALE' | 'FEMALE' | 'NON_BINARY';
    initialRoles?: string[];
    initialIsActive?: boolean;
}

export function useCompanyMemberFormDialog() {
    return useEntityFormDialog<CompanyMemberFormData>({
        createTitle: "Create New Member",
        editTitle: "Edit Member",
        createDescription:
            "Add a new member to the company with roles and permissions.",
        editDescription: "Modify member details and permissions.",
        renderForm: ({ mode, formData, onSave, onCancel }) => {
            const defaultValues = mode === "create" 
                ? {} 
                : {
                    user: {
                        email: formData?.initialEmail || "",
                        firstName: formData?.initialFirstName || "",
                        lastName: formData?.initialLastName || "",
                        gender: formData?.initialGender || 'MALE',
                        isActive: formData?.initialIsActive ?? true,
                    },
                    roleUuids: formData?.initialRoles || [],
                };

            return (
                <CompanyMemberForm
                    mode={mode}
                    companyUuid={formData?.companyUuid || ''}
                    defaultValues={defaultValues}
                    onSubmit={onSave}
                    onCancel={onCancel}
                />
            );
        },
    });
}