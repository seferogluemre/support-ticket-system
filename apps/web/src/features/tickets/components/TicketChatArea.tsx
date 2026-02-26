import { Avatar, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from '#/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '#/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover';
import { ScrollArea } from '#/components/ui/scroll-area';
import { Textarea } from '#/components/ui/textarea';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { History, MessageSquare, Send, Zap, MoreHorizontal, FileText, Printer, List } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPDF } from './TicketPDF';
import { Ticket, Reply, TicketEvent } from '../types';
import { CANNED_RESPONSES } from '../data/ticket-constants';

interface TicketChatAreaProps {
    ticket: Ticket;
    replies: Reply[];
    events: TicketEvent[];
    viewMode: 'chat' | 'events';
    setViewMode: React.Dispatch<React.SetStateAction<'chat' | 'events'>>;
    isPdfDialogOpen: boolean;
    setIsPdfDialogOpen: (open: boolean) => void;
    replyMessage: string;
    setReplyMessage: (msg: string) => void;
    onSendReply: () => void;
    getInitials: (name: string) => string;
}

export function TicketChatArea({
    ticket,
    replies,
    events,
    viewMode,
    setViewMode,
    isPdfDialogOpen,
    setIsPdfDialogOpen,
    replyMessage,
    setReplyMessage,
    onSendReply,
    getInitials,
}: TicketChatAreaProps) {
    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* Ticket Header */}
            <div className="p-4 border-b space-y-2 bg-background flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                    <h1 className="text-lg font-semibold leading-tight text-foreground truncate pr-4">{ticket.subject}</h1>
                    <div className="flex items-center gap-2">
                        <TicketStatusBadge status={ticket.status} />
                        <span className="text-xs text-muted-foreground font-mono">
                            #{ticket.id}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                    {/* Summary Popover Toggle Button */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs shadow-sm bg-background hover:bg-muted"
                                title="Bilet Özeti"
                            >
                                <List className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[300px] p-4 space-y-2">
                            <h4 className="font-semibold text-sm">Bilet Özeti</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {ticket.description?.substring(0, 150) || "Bu bilet için henüz bir özet oluşturulmadı."}
                                {ticket.description && ticket.description.length > 150 ? "..." : ""}
                            </p>
                        </PopoverContent>
                    </Popover>

                    {/* Event History Toggle Button */}
                    <Button
                        variant={viewMode === 'events' ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode(prev => prev === 'chat' ? 'events' : 'chat')}
                        className={`h-8 px-3 text-xs gap-2 transition-colors shadow-sm ${viewMode === 'events' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800' : 'bg-background hover:bg-muted'}`}
                    >
                        {viewMode === 'events' ? (
                            <>
                                <MessageSquare className="h-3.5 w-3.5" />
                                Bilete Dön
                            </>
                        ) : (
                            <>
                                <History className="h-3.5 w-3.5" />
                                Geçmiş Olaylar
                            </>
                        )}
                    </Button>

                    {/* Options Menu & Dialog Trigger */}
                    <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-muted shadow-sm">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DialogTrigger asChild>
                                    <DropdownMenuItem className="gap-2 cursor-pointer text-xs">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                        PDF Olarak Dışa Aktar
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => window.print()}>
                                    <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                                    Yazdır
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* PDF Dialog Content */}
                        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle>PDF Önizleme</DialogTitle>
                                <DialogDescription>
                                    Bilet detayını dışa aktarmadan önce oluşan raporu inceleyebilir ve kaydedebilirsiniz.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden bg-muted/30">
                                {ticket && (
                                    <PDFViewer width="100%" height="100%" className="border-none">
                                        <TicketPDF ticket={ticket} />
                                    </PDFViewer>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Dynamic Area based on View Mode */}
            {viewMode === 'events' ? (
                <ScrollArea className="flex-1 p-5 min-h-[400px] max-h-[500px] bg-muted/5">
                    <div className="space-y-6">
                        <div className="text-sm font-semibold text-foreground/80 mb-2 border-b pb-2">İşlem Geçmişi</div>
                        <div className="space-y-4">
                            {events.map((event) => (
                                <div key={event.id} className="flex gap-3">
                                    <Avatar className="h-7 w-7 flex-shrink-0">
                                        <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold border-indigo-200 border">
                                            {event.actorInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-0.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs font-semibold text-foreground">
                                                {event.actor}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(event.createdAt, 'dd MMM yyyy HH:mm', { locale: tr })}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {event.action}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            ) : (
                <>
                    {/* Conversation Area */}
                    <ScrollArea className="flex-1 p-5 min-h-[400px] max-h-[500px] bg-muted/5">
                        <div className="space-y-6">
                            {/* Initial Message (Ticket Description) */}
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                                    <AvatarFallback className="text-xs bg-blue-500 text-white">
                                        {getInitials(ticket.requesterName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-semibold text-foreground">
                                            {ticket.requesterName}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(ticket.createdAt), {
                                                addSuffix: true,
                                                locale: tr,
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-background border shadow-sm rounded-lg rounded-tl-none p-3.5 mt-1 inline-block">
                                        {ticket.description}
                                    </div>
                                </div>
                            </div>

                            {/* Replies */}
                            {replies.map((reply) => (
                                <div key={reply.id} className={`flex gap-3 ${reply.isAgent ? 'flex-row-reverse' : ''}`}>
                                    <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5 shadow-sm">
                                        <AvatarFallback className={`text-xs text-white ${reply.isAgent ? 'bg-indigo-600' : 'bg-green-500'}`}>
                                            {reply.senderInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`flex-1 space-y-1 flex flex-col ${reply.isAgent ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-baseline gap-2 ${reply.isAgent ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-sm font-semibold text-foreground">
                                                {reply.sender}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(reply.createdAt), {
                                                    addSuffix: true,
                                                    locale: tr,
                                                })}
                                            </span>
                                        </div>
                                        <div className={`text-sm whitespace-pre-wrap leading-relaxed shadow-sm p-3.5 mt-1 max-w-[85%] 
                      ${reply.isAgent
                                                ? 'bg-indigo-600 text-white rounded-lg rounded-tr-none'
                                                : 'bg-background border text-foreground/90 rounded-lg rounded-tl-none'}`}
                                        >
                                            {reply.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Reply Area */}
                    <div className="p-4 border-t bg-background">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>Yanıtla</span>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1.5 shadow-sm">
                                        <Zap className="h-3.5 w-3.5 text-amber-500" /> Şablonlar
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-[320px] p-2">
                                    <div className="space-y-1">
                                        <div className="text-xs font-semibold px-2 py-1 text-muted-foreground uppercase tracking-wider">Hazır Mesaj Şablonları</div>
                                        {CANNED_RESPONSES.map((msg: string, idx: number) => (
                                            <Button
                                                key={idx}
                                                variant="ghost"
                                                className="w-full justify-start text-left h-auto py-2 px-2 text-xs whitespace-normal font-normal text-foreground/90 hover:bg-muted"
                                                onClick={() => {
                                                    setReplyMessage(msg);
                                                }}
                                            >
                                                {msg}
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="relative">
                            <Textarea
                                placeholder="Mesajınızı buraya yazın... (Göndermek için Enter'a basın)"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onSendReply();
                                    }
                                }}
                                className="min-h-[100px] resize-none pr-28 text-sm focus-visible:ring-indigo-500/50"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center justify-end">
                                <Button
                                    size="sm"
                                    onClick={onSendReply}
                                    disabled={!replyMessage.trim()}
                                    className="gap-1.5 h-8 px-3 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    Gönder
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
