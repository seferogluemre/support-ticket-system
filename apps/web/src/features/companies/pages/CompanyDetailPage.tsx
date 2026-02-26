import { Avatar, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { Separator } from '#/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select';
import { Input } from '#/components/ui/input';

import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '#/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group';
import { Label } from '#/components/ui/label';
import { ChevronDown, SlidersHorizontal, ArrowLeft, X, UserPlus, Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useCompany } from '../hooks';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getRecentTickets } from '#/features/tickets/data/mock-tickets';
import { TicketStatus } from '#/features/tickets/types';

interface CompanyDetailPageProps {
    companyUuid: string;
}

export default function CompanyDetailPage({ companyUuid }: CompanyDetailPageProps) {
    const navigate = useNavigate();
    const { company, isLoading } = useCompany(companyUuid);

    const statusMap: Record<TicketStatus, string> = {
        [TicketStatus.OPEN]: 'Açık',
        [TicketStatus.IN_PROGRESS]: 'İşlemde',
        [TicketStatus.PENDING]: 'Beklemede',
        [TicketStatus.SOLVED]: 'Çözüldü',
        [TicketStatus.CLOSED]: 'Kapalı',
    };

    const statusColor: Record<TicketStatus, string> = {
        [TicketStatus.OPEN]: 'bg-blue-100 text-blue-700',
        [TicketStatus.IN_PROGRESS]: 'bg-purple-100 text-purple-700',
        [TicketStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
        [TicketStatus.SOLVED]: 'bg-green-100 text-green-700',
        [TicketStatus.CLOSED]: 'bg-slate-100 text-slate-700',
    };

    const companyTickets = getRecentTickets(5); // In real app, filter by company.uuid

    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [domains, setDomains] = useState<string[]>([]);
    const [domainInput, setDomainInput] = useState('');
    const [usersView, setUsersView] = useState('org');
    const [department, setDepartment] = useState('');
    const [details, setDetails] = useState('');
    const [notes, setNotes] = useState('');

    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState('son_kullanici');

    const [activeTab, setActiveTab] = useState('tickets');
    const [mockUsers, setMockUsers] = useState([
        { name: "Ahmet Yılmaz", email: "ahmet@example.com", role: "Yönetici", lastLogin: "Bugün 09:15" },
        { name: "Zeynep Çelik", email: "zeynep@example.com", role: "Destek Personeli", lastLogin: "Dün 14:30" },
        { name: "Mehmet Demir", email: "mehmet@example.com", role: "Kullanıcı", lastLogin: "23 Şubat 2026" }
    ]);

    useEffect(() => {
        if (company) {
            const rawWeb = (company as any).website?.replace(/^https?:\/\//, '');
            if (rawWeb && domains.length === 0) {
                setDomains([rawWeb]);
            }
        }
    }, [company]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Şirket yükleniyor...</div>;
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-muted-foreground">Şirket bulunamadı.</p>
                <Button onClick={() => navigate({ to: '/companies' })}>
                    Şirket Listesine Dön
                </Button>
            </div>
        );
    }

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

    return (
        <div className="flex h-screen bg-background">
            {/* Left Sidebar */}
            <div className="w-[280px] bg-muted/5 border-r p-6 flex flex-col gap-6 overflow-y-auto hidden md:flex">
                <div className="space-y-4">
                    <div className="flex flex-col gap-2 border-b pb-3">
                        <span className="text-[12px] text-muted-foreground font-medium">Etiketler</span>
                        <div className="flex flex-wrap gap-1">
                            {tags.map((t, i) => (
                                <span key={i} className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                                    {t} <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
                                </span>
                            ))}
                        </div>
                        <Input
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && tagInput.trim()) {
                                    setTags([...tags, tagInput.trim()]);
                                    setTagInput('');
                                }
                            }}
                            placeholder="Yeni etiket (Enter)..."
                            className="h-7 text-[11px] px-2"
                        />
                    </div>

                    <div className="flex flex-col gap-2 border-b pb-3">
                        <span className="text-[12px] text-muted-foreground font-medium">Alan adları</span>
                        <div className="flex flex-wrap gap-1">
                            {domains.map((t, i) => (
                                <span key={i} className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                                    {t} <X className="h-3 w-3 cursor-pointer hover:text-blue-500" onClick={() => setDomains(domains.filter((_, idx) => idx !== i))} />
                                </span>
                            ))}
                        </div>
                        <Input
                            value={domainInput}
                            onChange={e => setDomainInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && domainInput.trim()) {
                                    setDomains([...domains, domainInput.trim()]);
                                    setDomainInput('');
                                }
                            }}
                            placeholder="domain.com (Enter)..."
                            className="h-7 text-[11px] px-2"
                        />
                    </div>

                    <div className="flex flex-col gap-1 border-b pb-3">
                        <span className="text-[12px] text-muted-foreground font-medium">Kullanıcılar</span>
                        <Select value={usersView} onValueChange={setUsersView}>
                            <SelectTrigger className="h-7 w-full text-[11px] px-2 bg-transparent">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="org" className="text-[11px]">Organizasyona ait biletler görüntülenebilir</SelectItem>
                                <SelectItem value="own" className="text-[11px]">Sadece kendi biletlerinizi görüntüleyebilir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1 border-b pb-3">
                        <span className="text-[12px] text-muted-foreground font-medium">Grup</span>
                        <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger className="h-7 w-full text-[11px] px-2 bg-transparent">
                                <SelectValue placeholder="Grup seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="destek" className="text-[11px]">Destek</SelectItem>
                                <SelectItem value="satis" className="text-[11px]">Satış & Pazarlama</SelectItem>
                                <SelectItem value="muhasebe" className="text-[11px]">Muhasebe & Finans</SelectItem>
                                <SelectItem value="teknik" className="text-[11px]">Teknik Ekip</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between border-b pb-3 gap-2">
                        <span className="text-[12px] text-muted-foreground font-medium w-16 text-left">Detaylar</span>
                        <Input value={details} onChange={e => setDetails(e.target.value)} placeholder="Detay ekle..." className="h-7 text-[11px] px-2 flex-1 w-0" />
                    </div>

                    <div className="flex items-center justify-between gap-2 pb-1">
                        <span className="text-[12px] text-muted-foreground font-medium w-16 text-left">Notlar</span>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Not ekle..." className="h-7 text-[11px] px-2 flex-1 w-0" />
                    </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="space-y-2 text-[11px] text-muted-foreground/80">
                    <div className="flex gap-2">
                        <span className="w-20">Oluşturuldu</span>
                        <span className="font-medium text-foreground/70">{format(new Date(company.createdAt), 'MMM dd HH:mm')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="w-20">Güncellendi</span>
                        <span className="font-medium text-foreground/70">{format(new Date(company.updatedAt), 'MMM dd HH:mm')}</span>
                    </div>
                </div>
            </div>

            {/* Right Main Area */}
            <div className="flex-1 flex flex-col overflow-x-hidden pt-2 bg-muted/20">
                <div className="max-w-6xl w-full mx-auto flex flex-col h-full bg-background border-x shadow-sm">
                    {/* Back Button for mobile / optional */}
                    <div className="px-6 pb-2 block md:hidden">
                        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/companies' })} className="gap-2 -ml-3">
                            <ArrowLeft className="h-4 w-4" /> Geri
                        </Button>
                    </div>

                    {/* Header */}
                    <div className="px-8 py-5 flex items-center justify-between border-b">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-slate-500 text-white shadow-sm">
                                <AvatarFallback className="rounded-lg font-semibold bg-slate-500 text-sm">{getInitials(company.name)}</AvatarFallback>
                            </Avatar>
                            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">{company.name}</h1>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 text-sm h-9 shadow-sm">
                                    Eylemler <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => setIsAddUserOpen(true)} className="cursor-pointer">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    <span>Yeni kullanıcı ekle</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-red-600 focus:text-red-600 cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Organizasyonu sil</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Tabs Area */}
                    <div className="flex-1 px-8 py-4 overflow-y-auto">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="bg-transparent border-b w-auto min-w-[300px] justify-start h-auto p-0 rounded-none mb-6 gap-8">
                                <TabsTrigger
                                    value="tickets"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm font-medium transition-all"
                                >
                                    Biletler (0)
                                </TabsTrigger>
                                <TabsTrigger
                                    value="users"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm font-medium text-muted-foreground transition-all"
                                >
                                    Kullanıcılar (0)
                                </TabsTrigger>
                                <TabsTrigger
                                    value="related"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm font-medium text-muted-foreground transition-all"
                                >
                                    İlgili
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="tickets" className="space-y-4 animate-in fade-in-50 duration-300">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 gap-2 text-[12px] font-medium text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:text-blue-700 shadow-sm">
                                            <SlidersHorizontal className="h-3.5 w-3.5" /> Filtrele
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-4 ml-6" align="start">
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold leading-none mb-1.5">Biletleri Filtrele</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Aşağıdaki seçeneklere göre filtreleyin.
                                            </p>
                                        </div>
                                        <div className="space-y-4 text-sm flex flex-col">
                                            {[
                                                "Bilet durumu",
                                                "İD",
                                                "Ders",
                                                "Talep Eden",
                                                "Talep edildi",
                                                "Güncellendi",
                                                "Grup",
                                                "Atanan kişi"
                                            ].map((opt) => (
                                                <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                                                    <span className="text-sm text-foreground/80 group-hover:text-foreground">{opt}</span>
                                                </label>
                                            ))}
                                            <Button className="mt-4 w-full h-8 text-xs" size="sm">Filtreleri Uygula</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <div className="text-[13px] text-muted-foreground font-medium mt-3 mb-2">{companyTickets.length} bilet</div>

                                <div className="border rounded-md overflow-hidden bg-background shadow-sm">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/30 border-b">
                                            <tr>
                                                <th className="font-semibold py-3.5 px-4 text-foreground/80 truncate max-w-[120px]">Bilet durumu</th>
                                                <th className="font-semibold py-3.5 px-3 text-foreground/80">İD</th>
                                                <th className="font-semibold py-3.5 px-3 text-foreground/80">Ders / Konu</th>
                                                <th className="font-semibold py-3.5 px-3 text-foreground/80">Talep Eden</th>
                                                <th className="font-semibold py-3.5 px-3 text-foreground/80">Oluşturuldu</th>
                                                <th className="font-semibold py-3.5 px-3 text-foreground/80">Güncellendi</th>
                                                <th className="font-semibold py-3.5 px-3 text-foreground/80">Grup</th>
                                                <th className="font-semibold py-3.5 px-4 text-foreground/80 max-w-[120px] truncate">Atanan kişi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {companyTickets.map((ticket) => (
                                                <tr key={ticket.uuid} onClick={() => navigate({ to: '/tickets/$uuid', params: { uuid: ticket.uuid } })} className="hover:bg-muted/30 cursor-pointer">
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor[ticket.status]}`}>
                                                            {statusMap[ticket.status]}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 font-medium text-blue-600">#{ticket.id}</td>
                                                    <td className="py-3 px-3 text-foreground/90 font-medium truncate max-w-[150px]">{ticket.subject}</td>
                                                    <td className="py-3 px-3 text-muted-foreground">{ticket.requesterName}</td>
                                                    <td className="py-3 px-3 text-muted-foreground">{format(new Date(ticket.createdAt), 'dd MMM yy')}</td>
                                                    <td className="py-3 px-3 text-muted-foreground">{format(new Date(ticket.updatedAt), 'dd MMM yy')}</td>
                                                    <td className="py-3 px-3 text-muted-foreground">Destek</td>
                                                    <td className="py-3 px-4 text-muted-foreground flex items-center gap-2">
                                                        <Avatar className="h-5 w-5 rounded-full"><AvatarFallback className="text-[9px]">ST</AvatarFallback></Avatar>
                                                        <span className="truncate">Support Team</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>

                            <TabsContent value="users" className="space-y-4 animate-in fade-in-50 duration-300">
                                <div className="flex justify-between items-center mt-3 mb-2">
                                    <div className="text-[13px] text-muted-foreground font-medium">{mockUsers.length} Kullanıcı</div>
                                </div>
                                <div className="border rounded-md overflow-hidden bg-background shadow-sm">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/30 border-b">
                                            <tr>
                                                <th className="font-semibold py-3.5 px-4 text-foreground/80">Kullanıcı Adı</th>
                                                <th className="font-semibold py-3.5 px-4 text-foreground/80">E-posta Adresi</th>
                                                <th className="font-semibold py-3.5 px-4 text-foreground/80">Rol</th>
                                                <th className="font-semibold py-3.5 px-4 text-foreground/80">Son Giriş</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {mockUsers.map((user, i) => (
                                                <tr key={i} className="hover:bg-muted/30 cursor-pointer">
                                                    <td className="py-3 px-4 font-medium flex items-center gap-3">
                                                        <Avatar className="h-6 w-6 rounded-full"><AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">{user.name.substring(0, 2)}</AvatarFallback></Avatar>
                                                        {user.name}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">{user.role}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">{user.lastLogin}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>
                            <TabsContent value="related" className="py-12 text-center text-sm text-muted-foreground animate-in fade-in-50 duration-300 border rounded-md">
                                İlgili veri bulunamadı.
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                        <DialogDescription>
                            Organizasyona yeni bir kullanıcı ekleyin. Bilgileri doldurup rolünü seçin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right text-xs">Kullanıcı Adı</Label>
                            <Input
                                id="name"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                className="col-span-3 text-sm h-9"
                                placeholder="Örn: Ahmet Yılmaz"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right text-xs">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                className="col-span-3 text-sm h-9"
                                placeholder="Örn: ahmet@example.com"
                            />
                        </div>
                        <div className="grid grid-cols-4 pt-2 border-t mt-2">
                            <Label className="text-right text-xs pt-1.5 pr-4">Rol</Label>
                            <RadioGroup value={newUserRole} onValueChange={setNewUserRole} className="col-span-3 flex flex-col gap-3">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="son_kullanici" id="r1" />
                                    <Label htmlFor="r1" className="text-sm font-normal cursor-pointer">Son kullanıcı</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="personel" id="r2" />
                                    <Label htmlFor="r2" className="text-sm font-normal cursor-pointer">Personel</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)} size="sm">İptal</Button>
                        <Button onClick={() => {
                            if (!newUserName.trim() || !newUserEmail.trim()) {
                                toast.error('Lütfen isim ve e-posta alanlarını doldurun.');
                                return;
                            }
                            const newUserObj = {
                                name: newUserName.trim(),
                                email: newUserEmail.trim(),
                                role: newUserRole === 'personel' ? 'Personel' : 'Kullanıcı',
                                lastLogin: 'Şimdi'
                            };
                            setMockUsers([newUserObj, ...mockUsers]);
                            toast.success('Kullanıcı başarıyla eklendi');
                            setIsAddUserOpen(false);
                            setActiveTab('users');
                            setNewUserName('');
                            setNewUserEmail('');
                        }} size="sm" className="bg-blue-600 hover:bg-blue-700">Kullanıcıyı Ekle</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" /> Organizasyonu Sil
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm leading-relaxed text-foreground/80">
                            <strong>{company.name}</strong> organizasyonunu silmek üzeresiniz. Bu işlem <strong className="text-red-500">geri alınamaz</strong> ve bağlı olan tüm verileri etkileyebilir. Emin misiniz?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} size="sm">Vazgeç</Button>
                        <Button onClick={() => {
                            // Mocking delete process
                            setIsDeleteOpen(false);
                            navigate({ to: '/companies' });
                        }} size="sm" variant="destructive">
                            Evet, Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
