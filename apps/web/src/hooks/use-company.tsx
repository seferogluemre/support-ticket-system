import { useCompanyContext } from '#/context/company-context';

/**
 * Hook to access company context
 * Provides backward compatibility with the old router-based approach
 * 
 * @param options.optional - If true, returns undefined instead of throwing when context is missing
 */
export function useCompany(options?: { optional?: boolean }) {
  try {
    const { companies, currentCompany, isLoading } = useCompanyContext();

    return {
      companies,
      currentCompany,
      companyUuid: currentCompany?.uuid,
      isLoading,
    };
  } catch (error) {
    if (options?.optional) {
      return {
        companies: [],
        currentCompany: null,
        companyUuid: undefined,
        isLoading: false,
      };
    }
    throw error;
  }
}