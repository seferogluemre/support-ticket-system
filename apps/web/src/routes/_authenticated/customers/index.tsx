import { createFileRoute } from '@tanstack/react-router';
import { CustomersIndexPage } from '#/features/customers/pages';

export const Route = createFileRoute('/_authenticated/customers/')({
  component: CustomersIndexPage,
});
