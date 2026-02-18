import { createFileRoute } from '@tanstack/react-router';
import { CompanyRolesIndexPage } from '#/features/company-roles';

export const Route = createFileRoute('/_authenticated/companies/$companyUuid/roles/')({
  component: CompanyRolesIndexPage,
});