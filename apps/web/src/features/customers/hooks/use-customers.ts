import { useQuery } from '@tanstack/react-query';
import type { Customer } from '../types';
import { CUSTOMERS } from '../data/customer-constants';

interface UseCustomersOptions {
    search?: string;
}

function getCustomers(search?: string): Customer[] {
    if (!search) return CUSTOMERS;
    const query = search.toLowerCase();
    return CUSTOMERS.filter(
        (c) =>
            c.name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query)
    );
}

export function useCustomers(options: UseCustomersOptions = {}) {
    const { search } = options;

    return useQuery<Customer[]>({
        queryKey: ['customers', search],
        queryFn: () => getCustomers(search),
        staleTime: 30 * 1000,
    });
}
