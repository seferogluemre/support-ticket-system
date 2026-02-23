import { Button } from '#/components/ui/button';
import { Card } from '#/components/ui/card';
import { Skeleton } from '#/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { TicketSidebarLeft, TicketSidebarRight, TicketChatArea } from '../components';
import { useTicket } from '../hooks';
import { TicketPriority, TicketStatus, Reply, TicketEvent } from '../types';

interface TicketDetailPageProps {
  ticketUuid: string;
}

export default function TicketDetailPage({ ticketUuid }: TicketDetailPageProps) {
  const navigate = useNavigate();
  const { ticket, isLoading, updateTicket, isUpdating } = useTicket({
    uuid: ticketUuid,
  });
  const [replyMessage, setReplyMessage] = useState('');
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);

  // Mock replies state for chat presentation
  const [replies, setReplies] = useState<Reply[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [viewMode, setViewMode] = useState<'chat' | 'events'>('chat');

  // Initialize mock reply and event when ticket is loaded
  useEffect(() => {
    if (ticket && replies.length === 0) {
      setReplies([
        {
          id: 'mock-1',
          sender: 'Support Team',
          senderInitials: 'ST',
          content: 'Talebiniz alınmıştır. En kısa sürede size dönüş yapacağız.',
          createdAt: new Date(new Date(ticket.createdAt).getTime() + 30 * 60000), // 30 mins after ticket
          isAgent: true
        }
      ]);
      setEvents([
        {
          id: 'evt-1',
          actor: ticket.requesterName,
          actorInitials: getInitials(ticket.requesterName),
          action: 'Ticket oluşturuldu.',
          createdAt: new Date(ticket.createdAt),
        }
      ]);
    }
  }, [ticket, replies.length]);

  const recordEvent = (action: string) => {
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        actor: 'Sen (Agent)',
        actorInitials: 'SN',
        action,
        createdAt: new Date(),
      },
    ]);
  };

  const handleStatusChange = (status: TicketStatus) => {
    updateTicket({
      uuid: ticketUuid,
      data: { status },
    });
    recordEvent(`Ticket durumunu değiştirdi: ${status}`);
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    updateTicket({
      uuid: ticketUuid,
      data: { priority },
    });
    recordEvent(`Ticket önceliğini değiştirdi: ${priority}`);
  };

  const addReply = (content: string) => {
    const newReply: Reply = {
      id: Date.now().toString(),
      sender: 'Sen (Agent)',
      senderInitials: 'SN',
      content: content,
      createdAt: new Date(),
      isAgent: true,
    };
    setReplies(prev => [...prev, newReply]);
    recordEvent(`Müşteriye yeni bir mesaj gönderildi.`);
  };

  const handleSendReply = () => {
    if (replyMessage.trim()) {
      addReply(replyMessage);
      setReplyMessage('');
    }
  };

  if (isLoading) {
    return <TicketDetailSkeleton />;
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-muted-foreground">Ticket bulunamadı.</p>
        <Button onClick={() => navigate({ to: '/tickets' })}>
          Ticket Listesine Dön
        </Button>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: '/tickets' })}
        className="gap-2 -ml-3"
      >
        <ArrowLeft className="h-4 w-4" />
        Geri
      </Button>

      {/* Main Single Container */}
      <Card className="flex flex-col lg:flex-row border shadow-sm overflow-hidden bg-background">
        <TicketSidebarLeft
          ticket={ticket}
          isUpdating={isUpdating}
          onPriorityChange={handlePriorityChange}
          getInitials={getInitials}
        />

        <TicketChatArea
          ticket={ticket}
          replies={replies}
          events={events}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isPdfDialogOpen={isPdfDialogOpen}
          setIsPdfDialogOpen={setIsPdfDialogOpen}
          replyMessage={replyMessage}
          setReplyMessage={setReplyMessage}
          onSendReply={handleSendReply}
          getInitials={getInitials}
        />

        <TicketSidebarRight
          ticket={ticket}
          isUpdating={isUpdating}
          onStatusChange={handleStatusChange}
          getInitials={getInitials}
        />
      </Card>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <Skeleton className="h-8 w-24" />
      <Card className="flex flex-col lg:flex-row h-[700px]">
        <div className="w-[200px] border-r p-4 space-y-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 flex flex-col p-4 space-y-4 border-r">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="flex-1 w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
        <div className="w-[260px] p-4 space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1" />
          </div>
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    </div>
  );
}