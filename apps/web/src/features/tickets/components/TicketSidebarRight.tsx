import { Avatar, AvatarFallback } from '#/components/ui/avatar';
import { Label } from '#/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '#/components/ui/select';
import { Separator } from '#/components/ui/separator';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Mail } from 'lucide-react';
import { TicketStatus, Ticket } from '../types';

interface TicketSidebarRightProps {
    ticket: Ticket;
    isUpdating: boolean;
    onStatusChange: (status: TicketStatus) => void;
    getInitials: (name: string) => string;
}

export function TicketSidebarRight({
    ticket,
    isUpdating,
    onStatusChange,
    getInitials,
}: TicketSidebarRightProps) {
    return (
        <div className="w-full lg:w-[260px] flex-shrink-0 p-4 border-l bg-muted/10">
            <div className="flex items-center gap-3 mb-5">
                <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarFallback className="text-xs bg-blue-500 text-white font-medium">
                        {getInitials(ticket.requesterName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                        {ticket.requesterName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium">Müşteri</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-3">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">İletişim</Label>
                    <div className="flex items-center gap-2 group">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <a
                            href={`mailto:${ticket.requesterEmail}`}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                        >
                            {ticket.requesterEmail}
                        </a>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground flex-shrink-0 w-3.5 text-center">🕒</span>
                        <p className="text-xs text-foreground/80">
                            {format(new Date(), 'HH:mm (EEE)', { locale: tr })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground flex-shrink-0 w-3.5 text-center">🌐</span>
                        <p className="text-xs text-foreground/80">Türkçe</p>
                    </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Status Change */}
                <div className="space-y-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Durum Değiştir
                    </Label>
                    <Select
                        value={ticket.status}
                        onValueChange={onStatusChange}
                        disabled={isUpdating}
                    >
                        <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TicketStatus.OPEN} className="text-xs">Açık</SelectItem>
                            <SelectItem value={TicketStatus.IN_PROGRESS} className="text-xs">Devam Ediyor</SelectItem>
                            <SelectItem value={TicketStatus.PENDING} className="text-xs">Beklemede</SelectItem>
                            <SelectItem value={TicketStatus.SOLVED} className="text-xs">Çözüldü</SelectItem>
                            <SelectItem value={TicketStatus.CLOSED} className="text-xs">Kapalı</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator className="bg-border/50" />

                {/* Timestamps */}
                <div className="space-y-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Zaman Çizelgesi</Label>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Oluşturuldu</span>
                            <span className="text-xs font-medium text-foreground/80">
                                {format(new Date(ticket.createdAt), 'dd.MM.yyyy')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Güncellendi</span>
                            <span className="text-xs font-medium text-foreground/80">
                                {format(new Date(ticket.updatedAt), 'dd.MM.yyyy')}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
