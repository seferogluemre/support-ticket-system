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
import { useState } from 'react';
import { Textarea } from '#/components/ui/textarea';
import { Button } from '#/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '#/components/ui/accordion';

// Mock previous tickets for Activity History
const MOCK_PAST_TICKETS = [
    { id: '#1023', subject: 'Şifremi unuttum', date: '2023-11-10', status: 'Çözüldü' },
    { id: '#984', subject: 'Ödeme alınamadı hatası', date: '2023-09-05', status: 'Kapalı' },
];

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
    const [note, setNote] = useState('');
    const [savedNotes, setSavedNotes] = useState<string[]>([]);

    const handleSaveNote = () => {
        if (note.trim()) {
            setSavedNotes([note, ...savedNotes]);
            setNote('');
        }
    };

    return (
        <div className="w-full lg:w-[260px] flex-shrink-0 p-4 border-l bg-muted/10 overflow-y-auto">
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

            <div className="space-y-5 pt-1">
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

                {/* Notes Section */}
                <div className="space-y-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notlar</Label>
                    <Textarea
                        placeholder="Kullanıcıya dair not ekleyin..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="h-20 text-xs resize-none"
                    />
                    <Button variant="secondary" size="sm" className="w-full text-xs h-7" onClick={handleSaveNote}>
                        Notu Kaydet
                    </Button>
                    {savedNotes.length > 0 && (
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                            {savedNotes.map((n, idx) => (
                                <div key={idx} className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded text-xs text-foreground/80 border border-yellow-200 dark:border-yellow-900/50">
                                    {n}
                                </div>
                            ))}
                        </div>
                    )}
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

                <Separator className="bg-border/50" />

                {/* Activity History Accordion */}
                <div className="space-y-2 pb-4">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Geçmiş İşlemler</Label>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="activity-history" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-2 text-xs font-medium text-foreground/80 hover:text-foreground">
                                Aktivite Geçmişi
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3 pt-2">
                                    {MOCK_PAST_TICKETS.map(t => (
                                        <div key={t.id} className="text-xs space-y-1 bg-background p-2 rounded border shadow-sm">
                                            <div className="flex justify-between font-medium">
                                                <span className="text-indigo-600 dark:text-indigo-400">{t.id}</span>
                                                <span className="text-muted-foreground">{t.date}</span>
                                            </div>
                                            <div className="truncate text-foreground/90">{t.subject}</div>
                                            <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Çözüldü' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                {t.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

            </div>
        </div>
    );
}
