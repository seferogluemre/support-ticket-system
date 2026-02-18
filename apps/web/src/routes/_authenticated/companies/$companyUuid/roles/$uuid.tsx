import { createFileRoute } from '@tanstack/react-router';
import { CompanyRoleEditPage } from '#/features/company-roles';

export const Route = createFileRoute('/_authenticated/companies/$companyUuid/roles/$uuid')({
  component: CompanyRoleEditPage,
});