import { ExternalLink } from 'lucide-react';
import { Button } from '#/components/ui/button';

export function CustomersHeader() {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
                <p className="text-sm text-muted-foreground">
                    Add, search, and manage your customers (end users) all in one place.{' '}
                    <a
                        href="#"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                        Learn about this page
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2">
                    Bulk import
                    <ExternalLink className="h-4 w-4" />
                </Button>
                <Button className="gap-2 bg-[#025b96] hover:bg-[#025b96]/90 text-white">
                    Add customer
                </Button>
            </div>
        </div>
    );
}
