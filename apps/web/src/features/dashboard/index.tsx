import { Header } from '#/components/layout/header';
import { Main } from '#/components/layout/main';
import { ProfileDropdown } from '#/components/profile-dropdown';
import { Search } from '#/components/search';
import { ThemeSwitch } from '#/components/theme-switch';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { Skeleton } from '#/components/ui/skeleton';
import { useCompanyContext } from '#/context/company-context';
import { TicketsList, TicketStatusFilter } from '#/features/tickets/components';
import { useTickets, useTicketStats } from '#/features/tickets/hooks';
import { TicketStatus } from '#/features/tickets/types';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  Ticket,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentCompany } = useCompanyContext();
  const [selectedStatuses, setSelectedStatuses] = useState<TicketStatus[]>([]);

  // Fetch ticket statistics
  const { data: stats, isLoading: isLoadingStats } = useTicketStats({
    companyUuid: currentCompany?.uuid,
  });

  // Fetch recent tickets
  const { data: recentTickets, isLoading: isLoadingTickets } = useTickets({
    companyUuid: currentCompany?.uuid,
    recent: true,
    limit: 10,
  });

  // Filter tickets based on selected statuses
  const filteredTickets = useMemo(() => {
    if (!recentTickets) return [];
    if (selectedStatuses.length === 0) return recentTickets;
    return recentTickets.filter((ticket) =>
      selectedStatuses.includes(ticket.status)
    );
  }, [recentTickets, selectedStatuses]);

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              {currentCompany
                ? `${currentCompany.name} - Support Ticket Sistemi`
                : 'Support Ticket Yönetim Sistemi'}
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: '/tickets/create' })}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Ticket className="mr-2 h-4 w-4" />
            Yeni Ticket Oluştur
          </Button>
        </div>

        {/* 2 Column Layout: Tickets List (Left) + Stats (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
          {/* Left Column - Tickets List */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Son Ticketlar</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      En son oluşturulan destek talepleri
                    </p>
                  </div>
                  <TicketStatusFilter
                    selectedStatuses={selectedStatuses}
                    onStatusChange={setSelectedStatuses}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <TicketsList
                  tickets={filteredTickets}
                  isLoading={isLoadingTickets}
                  showViewAll={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Statistics (Sticky) */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Statistics Cards */}
            {isLoadingStats ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                {/* Toplam Ticketlar */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Toplam Ticketlar
                    </CardTitle>
                    <Ticket className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.total || 0}</div>
                  </CardContent>
                </Card>

                {/* Açık Ticketlar */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Açık Ticketlar
                    </CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.open || 0}</div>
                  </CardContent>
                </Card>

                {/* Çözülmüş Ticketlar */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Çözülmüş Ticketlar
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.solved || 0}</div>
                  </CardContent>
                </Card>

                {/* Bugün Oluşturulan */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Bugün Oluşturulan
                    </CardTitle>
                    <Flame className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.createdToday || 0}</div>
                  </CardContent>
                </Card>

                {/* Öncelik Dağılımı */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Öncelik Dağılımı</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-sm">Düşük</span>
                      </div>
                      <span className="text-lg font-bold">
                        {stats?.priorityDistribution.low || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-sm">Normal</span>
                      </div>
                      <span className="text-lg font-bold">
                        {stats?.priorityDistribution.normal || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-sm">Yüksek</span>
                      </div>
                      <span className="text-lg font-bold">
                        {stats?.priorityDistribution.high || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-sm">Acil</span>
                      </div>
                      <span className="text-lg font-bold">
                        {stats?.priorityDistribution.urgent || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </Main>
    </>
  );
}