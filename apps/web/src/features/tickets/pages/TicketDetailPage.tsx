import { Avatar, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { Label } from '#/components/ui/label';
import { ScrollArea } from '#/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Separator } from '#/components/ui/separator';
import { Skeleton } from '#/components/ui/skeleton';
import { Textarea } from '#/components/ui/textarea';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowLeft, Mail, MessageSquare, Send, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { TicketPriorityBadge, TicketStatusBadge } from '../components';
import { useTicket } from '../hooks';
import { TicketPriority, TicketStatus } from '../types';

interface TicketDetailPageProps {
  ticketUuid: string;
}

export default function TicketDetailPage({ ticketUuid }: TicketDetailPageProps) {
  const navigate = useNavigate();
  const { ticket, isLoading, updateTicket, isUpdating } = useTicket({
    uuid: ticketUuid,
  });
  const [replyMessage, setReplyMessage] = useState('');

  const handleStatusChange = (status: TicketStatus) => {
    updateTicket({
      uuid: ticketUuid,
      data: { status },
    });
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    updateTicket({
      uuid: ticketUuid,
      data: { priority },
    });
  };

  const handleSendReply = () => {
    if (replyMessage.trim()) {
      // TODO: Send reply to API
      console.log('Sending reply:', replyMessage);
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
    <div className="space-y-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: '/tickets' })}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Geri
      </Button>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_320px] gap-4">
        {/* Left Sidebar - Ticket Metadata */}
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            {/* Requester */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Requester</Label>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(ticket.requesterName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">
                  {ticket.requesterName}
                </span>
              </div>
            </div>

            <Separator />

            {/* Assignee */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Assignee*</Label>
              <Select disabled>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Atanmadı" />
                </SelectTrigger>
              </Select>
            </div>

            <Separator />

            {/* Type */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select disabled>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="--" />
                </SelectTrigger>
              </Select>
            </div>

            <Separator />

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select
                value={ticket.priority}
                onValueChange={handlePriorityChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketPriority.LOW}>Düşük</SelectItem>
                  <SelectItem value={TicketPriority.NORMAL}>Normal</SelectItem>
                  <SelectItem value={TicketPriority.HIGH}>Yüksek</SelectItem>
                  <SelectItem value={TicketPriority.URGENT}>Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Center - Main Content */}
        <div className="space-y-4">
          {/* Ticket Header */}
          <Card className="p-4">
            <div className="space-y-3">
              <h1 className="text-xl font-bold">{ticket.subject}</h1>
              <div className="flex items-center gap-2">
                <TicketStatusBadge status={ticket.status} />
                <span className="text-sm text-muted-foreground font-mono">
                  #{ticket.id}
                </span>
              </div>
            </div>
          </Card>

          {/* Conversation Area */}
          <Card className="flex flex-col h-[600px]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Initial Message */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-blue-500 text-white">
                      {getInitials(ticket.requesterName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">
                        {ticket.requesterName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(ticket.createdAt, {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-3">
                      {ticket.description}
                    </div>
                  </div>
                </div>

                {/* Example Reply (Mock) */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-green-500 text-white">
                      SP
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">
                        Support Team
                      </span>
                      <span className="text-xs text-muted-foreground">
                        30 dakika önce
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-3">
                      Talebiniz alınmıştır. En kısa sürede size dönüş yapacağız.
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <Separator />

            {/* Reply Area */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>Public reply</span>
              </div>
              <Textarea
                placeholder="Yanıtınızı yazın..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Gönder
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Customer Info */}
        <div className="space-y-4">
          {/* Customer Card */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm bg-blue-500 text-white">
                  {getInitials(ticket.requesterName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {ticket.requesterName}
                </h3>
                <p className="text-xs text-muted-foreground">Customer</p>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`mailto:${ticket.requesterEmail}`}
                    className="text-blue-600 hover:underline truncate text-xs"
                  >
                    {ticket.requesterEmail}
                  </a>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Local time
                </Label>
                <p className="text-xs">
                  {format(new Date(), 'EEE, HH:mm', { locale: tr })}
                </p>
              </div>

              <Separator />

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Language</Label>
                <p className="text-xs">Türkçe</p>
              </div>
            </div>
          </Card>

          {/* Status Change */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">
                Ticket Durumu
              </Label>
              <Select
                value={ticket.status}
                onValueChange={handleStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketStatus.OPEN}>Açık</SelectItem>
                  <SelectItem value={TicketStatus.IN_PROGRESS}>
                    Devam Ediyor
                  </SelectItem>
                  <SelectItem value={TicketStatus.PENDING}>Beklemede</SelectItem>
                  <SelectItem value={TicketStatus.SOLVED}>Çözüldü</SelectItem>
                  <SelectItem value={TicketStatus.CLOSED}>Kapalı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Timestamps */}
          <Card className="p-4">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oluşturulma</span>
                <span className="font-medium">
                  {format(ticket.createdAt, 'dd.MM.yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Son Güncelleme</span>
                <span className="font-medium">
                  {format(ticket.updatedAt, 'dd.MM.yyyy')}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-24" />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_320px] gap-4">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[600px]" />
        <Skeleton className="h-[500px]" />
      </div>
    </div>
  );
}
