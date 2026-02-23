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
import { TicketPriority, Ticket } from '../types';

interface TicketSidebarLeftProps {
    ticket: Ticket;
    isUpdating: boolean;
    onPriorityChange: (priority: TicketPriority) => void;
    getInitials: (name: string) => string;
}

export function TicketSidebarLeft({
    ticket,
    isUpdating,
    onPriorityChange,
    getInitials,
}: TicketSidebarLeftProps) {
    return (
        <div className="w-full lg:w-[200px] flex-shrink-0 p-4 bg-muted/10 border-r space-y-5">
            {/* Requester */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Requester</Label>
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-blue-500 text-white">
                            {getInitials(ticket.requesterName)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                        {ticket.requesterName}
                    </span>
                </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Assignee */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Assignee*</Label>
                <Select disabled>
                    <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder="Atanmadı" />
                    </SelectTrigger>
                </Select>
            </div>

            <Separator className="bg-border/50" />

            {/* Type */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</Label>
                <Select disabled>
                    <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder="--" />
                    </SelectTrigger>
                </Select>
            </div>

            <Separator className="bg-border/50" />

            {/* Priority */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</Label>
                <Select
                    value={ticket.priority}
                    onValueChange={onPriorityChange}
                    disabled={isUpdating}
                >
                    <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={TicketPriority.LOW} className="text-xs">Düşük</SelectItem>
                        <SelectItem value={TicketPriority.NORMAL} className="text-xs">Normal</SelectItem>
                        <SelectItem value={TicketPriority.HIGH} className="text-xs">Yüksek</SelectItem>
                        <SelectItem value={TicketPriority.URGENT} className="text-xs">Acil</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
