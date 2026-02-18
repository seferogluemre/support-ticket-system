import { PageContainer } from '#/components/layout/page-container';
import { TicketDetailPage } from '#/features/tickets/pages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/tickets/$uuid')({
  component: TicketDetail,
});

function TicketDetail() {
  const { uuid } = Route.useParams();

  return (
    <PageContainer>
      <TicketDetailPage ticketUuid={uuid} />
    </PageContainer>
  );
}
