import { AlertTriangle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '#/components/ui/table';
import { Checkbox } from '#/components/ui/checkbox';
import { Avatar, AvatarFallback } from '#/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '#/components/ui/tooltip';
import type { Customer } from '../types';

interface CustomersTableProps {
    customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
    return (
        <div className="w-full">
            <div className="text-sm text-muted-foreground mb-4">
                {customers.length} customers
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="w-12 text-center">
                            <Checkbox aria-label="Select all" />
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                            Name
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                            Email
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                            Tags
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                            Timezone
                        </TableHead>
                        <TableHead className="font-semibold text-foreground text-right">
                            Last updated
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.map((customer) => (
                        <TableRow key={customer.id} className="border-b last:border-b-0">
                            <TableCell className="text-center">
                                <Checkbox aria-label={`Select ${customer.name}`} />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 bg-muted">
                                        <AvatarFallback className="text-xs text-muted-foreground bg-muted">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-4 w-4"
                                            >
                                                <path d="M18 20a6 6 0 0 0-12 0" />
                                                <circle cx="12" cy="10" r="4" />
                                            </svg>
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[#025b96] hover:underline cursor-pointer">
                                        {customer.name}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span>{customer.email}</span>
                                    {customer.hasAlert && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Alert message here</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{customer.tags}</TableCell>
                            <TableCell>{customer.timezone}</TableCell>
                            <TableCell className="text-right">
                                {customer.lastUpdated}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
