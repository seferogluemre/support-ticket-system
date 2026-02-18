import { DataTable } from '#/components/data-table';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { useCompanyContext } from '#/context/company-context';
import { useEntitySheetDialog } from '#/hooks';
import { FileDown, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { companyMembersColumns } from '../columns';
import { CompanyMemberDetailView } from '../components/CompanyMemberDetailView';
import { useCompanyMemberFormDialog, useCompanyMembers } from '../hooks';
import { CompanyMember, CompanyMemberCreatePayload, CompanyMemberUpdatePayload } from '../types';

import { CompanyMemberFormSubmitData } from '../components/forms/CompanyMemberForm';

interface CompanyMembersPageProps {
  companyUuid?: string;
}

export default function CompanyMembersPage({ companyUuid: propCompanyUuid }: CompanyMembersPageProps) {
  // Get company from context or prop
  const { currentCompany } = useCompanyContext();
  const companyUuid = propCompanyUuid ?? currentCompany?.uuid;

  if (!companyUuid) {
    throw new Error('No company selected');
  }

  // Hooks
  const {
    members,
    isLoading,
    createMemberAsync,
    updateMemberAsync,
    removeMember,
  } = useCompanyMembers(companyUuid);
  
  // Member form dialog
  const memberDialog = useCompanyMemberFormDialog();
  
  // Member detail sheet
  const memberSheet = useEntitySheetDialog<CompanyMember>({
    title: (member) => member?.name || 'Member Details',
    description: 'View and manage member information',
    side: 'right',
    renderContent: ({ mode, entity }) => (
      <CompanyMemberDetailView 
        member={entity} 
        onEdit={mode === 'view' ? () => {
          memberSheet.closeSheet();
          if (entity) handleEditMember(entity);
        } : undefined} 
      />
    ),
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Filtrelenmiş members data
  const filteredMembers = useMemo(() => {
    let filtered = members || [];

    // Status filtresi
    if (statusFilter === 'active') {
      filtered = filtered.filter((member) => member.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((member) => !member.isActive);
    }

    // Keyword search
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter((member) => {
        const name = member.name?.toLowerCase() || '';
        const email = member.email?.toLowerCase() || '';
        
        return (
          name.includes(keyword) ||
          email.includes(keyword)
        );
      });
    }

    return filtered;
  }, [members, statusFilter, searchKeyword]);

  // Handle create member
  const handleCreateMember = () => {
    memberDialog.openCreateDialog(async (data) => {
      const submitData = data as CompanyMemberFormSubmitData;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ...payload } = submitData;
      await createMemberAsync(payload as CompanyMemberCreatePayload);
    }, { companyUuid });
  };

  // Handle edit member
  const handleEditMember = (member: CompanyMember) => {
    memberDialog.openEditDialog(
      {
        memberId: member.userId,
        companyUuid,
        initialEmail: member.email,
        initialFirstName: member.firstName || '',
        initialLastName: member.lastName || '',
        initialRoles: member.roles?.map((r) => r.uuid) || [],
        initialIsActive: member.isActive,
      },
      async (data: unknown) => {
        const submitData = data as CompanyMemberFormSubmitData;
        
        // Update member
        await updateMemberAsync({
          userId: member.userId,
          payload: submitData as CompanyMemberUpdatePayload,
        });
      },
    );
  };

  const handleDeleteMember = (userId: string) => {
    const member = members?.find((m) => m.userId === userId);
    if (!member) return;

    // Owner kontrolü
    if (member.isOwner) {
      alert('Company owner\'ı silinemez');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${member.name} from this company?`)) {
      removeMember(userId);
    }
  };

  // Handler for viewing member details
  const handleViewMember = (member: CompanyMember) => {
    memberSheet.openSheet(member, 'view');
  };

  // Create columns with handlers
  const columnsWithActions = companyMembersColumns(handleDeleteMember, handleViewMember, handleEditMember);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as 'all' | 'active' | 'inactive');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Company Members</h1>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleCreateMember}>
            <Plus className="w-4 h-4 mr-2" />
            New Member
          </Button>
          <Button variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Keywords"
              className="pl-9 w-64"
              value={searchKeyword}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-muted-foreground">
        {filteredMembers.length} of {members?.length || 0} members
        {statusFilter !== 'all' && ` (${statusFilter})`}
        {searchKeyword && ` matching "${searchKeyword}"`}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columnsWithActions} data={filteredMembers} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <memberDialog.FormDialog />
      <memberSheet.SheetDialog />
    </div>
  );
}