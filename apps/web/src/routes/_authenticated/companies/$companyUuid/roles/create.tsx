import { createFileRoute } from '@tanstack/react-router';
import { CompanyRoleCreatePage } from '#/features/company-roles';

export const Route = createFileRoute('/_authenticated/companies/$companyUuid/roles/create')({
  component: CompanyRoleCreatePage,
});