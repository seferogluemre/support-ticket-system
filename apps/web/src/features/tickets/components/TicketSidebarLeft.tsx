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
import { Badge } from '#/components/ui/badge';
import { TicketPriority, Ticket } from '../types';
import { useState } from 'react';

const MOCK_CUSTOMERS = [
    { id: 'c1', name: 'Ahmet Yılmaz' },
    { id: 'c2', name: 'Ayşe Demir' },
    { id: 'c3', name: 'Caner Öz' }
];

const MOCK_AGENTS = [
    { id: 'a1', name: 'Destek Uzmanı (Ali)' },
    { id: 'a2', name: 'Teknik Destek (Zeynep)' },
];

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
    const [requester, setRequester] = useState(ticket.requesterName);
    const [assignee, setAssignee] = useState<string>('');
    const [followers, setFollowers] = useState<string[]>([]);
    const [duygusallik, setDuygusallik] = useState('Olumsuz');
    const [dilOzguveni, setDilOzguveni] = useState('Yüksek');
    const [niyetGuveni, setNiyetGuveni] = useState('Yüksek');
    const [duyguGuveni, setDuyguGuveni] = useState('Yüksek');
    const [dil, setDil] = useState('tr-TR');
    const [aiAgent, setAiAgent] = useState('AI-7892');

    const allUsers = [...MOCK_CUSTOMERS, ...MOCK_AGENTS];
    // Add current ticket requester to customers if not in the list
    const currentCustomers = MOCK_CUSTOMERS.some(c => c.name === ticket.requesterName)
        ? MOCK_CUSTOMERS
        : [{ id: 'current', name: ticket.requesterName }, ...MOCK_CUSTOMERS];

    const handleAddFollower = (val: string) => {
        if (!followers.includes(val) && val) {
            setFollowers([...followers, val]);
        }
    };

    const removeFollower = (val: string) => {
        setFollowers(followers.filter(f => f !== val));
    };

    return (
        <div className="w-full lg:w-[260px] flex-shrink-0 p-4 bg-muted/10 border-r space-y-5 overflow-y-auto">
            {/* Requester */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Müşteri (Requester)</Label>
                <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-blue-500 text-white">
                            {getInitials(requester)}
                        </AvatarFallback>
                    </Avatar>
                    <Select value={requester} onValueChange={setRequester}>
                        <SelectTrigger className="h-8 text-xs w-full border-none shadow-none focus:ring-0 px-0 bg-transparent flex-1">
                            <SelectValue placeholder="Müşteri Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {currentCustomers.map(c => (
                                <SelectItem key={c.id} value={c.name} className="text-xs">{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Assignee */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Destek (Assignee)</Label>
                <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder="Destek Personeli Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        {MOCK_AGENTS.map(a => (
                            <SelectItem key={a.id} value={a.name} className="text-xs">{a.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator className="bg-border/50" />

            {/* Followers */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Takipçiler</Label>
                <Select onValueChange={handleAddFollower} value="">
                    <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder="Takipçi Ekle..." />
                    </SelectTrigger>
                    <SelectContent>
                        {allUsers.map(u => (
                            <SelectItem key={u.id} value={u.name} className="text-xs">{u.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {followers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {followers.map(f => (
                            <Badge key={f} variant="secondary" className="text-[10px] flex items-center gap-1 cursor-pointer" onClick={() => removeFollower(f)}>
                                {f} <span className="text-muted-foreground hover:text-foreground">×</span>
                            </Badge>
                        ))}
                    </div>
                )}
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

            <Separator className="bg-border/50" />

            {/* Additional Metadata */}
            <div className="space-y-3">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Detaylar & AI Analizi</Label>

                <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs items-center">
                    <div className="text-muted-foreground">Etiketler:</div>
                    <div className="font-medium">#acil #destek</div>

                    <div className="text-muted-foreground">Özet:</div>
                    <div className="font-medium truncate" title="Kullanıcı sisteme giremiyor">Sistem giriş...</div>

                    <div className="text-muted-foreground">Özet yerel saati:</div>
                    <div className="font-medium">10:45</div>

                    <div className="text-muted-foreground">YZ Temsilci:</div>
                    <Select value={aiAgent} onValueChange={setAiAgent}>
                        <SelectTrigger className="h-6 text-[10px] w-full px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AI-7892" className="text-[10px]">AI-7892</SelectItem>
                            <SelectItem value="AI-1024" className="text-[10px]">AI-1024</SelectItem>
                            <SelectItem value="AI-5541" className="text-[10px]">AI-5541</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="text-muted-foreground">Niyet güveni:</div>
                    <Select value={niyetGuveni} onValueChange={setNiyetGuveni}>
                        <SelectTrigger className="h-6 text-[10px] w-full px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Yüksek" className="text-[10px]">Yüksek</SelectItem>
                            <SelectItem value="Orta" className="text-[10px]">Orta</SelectItem>
                            <SelectItem value="Düşük" className="text-[10px]">Düşük</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="text-muted-foreground">Duygusallık:</div>
                    <Select value={duygusallik} onValueChange={setDuygusallik}>
                        <SelectTrigger className="h-6 text-[10px] w-full px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Olumsuz" className="text-[10px]">Olumsuz</SelectItem>
                            <SelectItem value="Olumlu" className="text-[10px]">Olumlu</SelectItem>
                            <SelectItem value="Doğal" className="text-[10px]">Doğal</SelectItem>
                            <SelectItem value="Çok olumlu" className="text-[10px]">Çok olumlu</SelectItem>
                            <SelectItem value="Pozitif" className="text-[10px]">Pozitif</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="text-muted-foreground">Duygu güveni:</div>
                    <Select value={duyguGuveni} onValueChange={setDuyguGuveni}>
                        <SelectTrigger className="h-6 text-[10px] w-full px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Yüksek" className="text-[10px]">Yüksek</SelectItem>
                            <SelectItem value="Orta" className="text-[10px]">Orta</SelectItem>
                            <SelectItem value="Düşük" className="text-[10px]">Düşük</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="text-muted-foreground">Dil:</div>
                    <Select value={dil} onValueChange={setDil}>
                        <SelectTrigger className="h-6 text-[10px] w-full px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tr-TR" className="text-[10px]">tr-TR</SelectItem>
                            <SelectItem value="en-US" className="text-[10px]">en-US</SelectItem>
                            <SelectItem value="de-DE" className="text-[10px]">de-DE</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="text-muted-foreground">Dil özgüveni:</div>
                    <Select value={dilOzguveni} onValueChange={setDilOzguveni}>
                        <SelectTrigger className="h-6 text-[10px] w-full px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Yüksek" className="text-[10px]">Yüksek</SelectItem>
                            <SelectItem value="Orta" className="text-[10px]">Orta</SelectItem>
                            <SelectItem value="Düşük" className="text-[10px]">Düşük</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
