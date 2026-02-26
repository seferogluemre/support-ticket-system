import { CompanyDetailPage, companyQueryOptions } from '#/features/companies';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/companies/$companyUuid/view')({
    loader: ({ context, params: { companyUuid } }) => {
        return context.queryClient.ensureQueryData(companyQueryOptions(companyUuid));
    },
    component: () => {
        const { companyUuid } = Route.useParams();
        return <CompanyDetailPage companyUuid={companyUuid} />;
    },
    pendingComponent: () => (
        <div className="flex items-center justify-center h-screen">
            <div className="text-muted-foreground">Şirket yükleniyor...</div>
        </div>
    ),
});
