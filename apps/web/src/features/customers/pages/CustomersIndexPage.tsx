import { Search } from 'lucide-react';
import { PageContainer } from '#/components/layout/page-container';
import { Input } from '#/components/ui/input';
import { CustomersHeader } from '../components';
import { CustomersTable } from '../components';
import { useCustomers } from '../hooks';

export function CustomersIndexPage() {
    const { data: customers = [] } = useCustomers();

    return (
        <PageContainer className="p-8">
            <CustomersHeader />

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search customers"
                    className="pl-9 bg-background h-10 w-full sm:w-[400px]"
                />
            </div>

            <CustomersTable customers={customers} />
        </PageContainer>
    );
}
