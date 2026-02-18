import { useQuery } from '@tanstack/react-query';
import {
  citiesListQueryOptions,
  countriesListQueryOptions,
  regionsListQueryOptions,
  statesListQueryOptions,
  subregionsListQueryOptions,
} from '../queries/location-queries';

// ====================================================================
// Type definitions for query parameters
// ====================================================================

type CountryFilters = {
  page?: number;
  perPage?: number;
  search?: string;
};

type StateFilters = {
  page?: number;
  perPage?: number;
  search?: string;
  countryId?: number;
};

type CityFilters = {
  page?: number;
  perPage?: number;
  search?: string;
  countryId?: number;
  stateId?: number;
};

type RegionFilters = {
  page?: number;
  perPage?: number;
  search?: string;
};

type SubregionFilters = {
  page?: number;
  perPage?: number;
  search?: string;
  regionId?: number;
};

// ====================================================================
// 🌍 COUNTRIES HOOK
// ====================================================================
export function useCountries(filters?: CountryFilters) {
  const {
    data: countriesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...countriesListQueryOptions(filters),
  });

  return {
    countries: countriesResponse?.data,
    meta: countriesResponse?.meta,
    isLoading,
    error,
    refetch,
  };
}

// ====================================================================
// 🏛️ STATES HOOK
// ====================================================================
export function useStates(filters?: StateFilters) {
  const {
    data: statesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...statesListQueryOptions(filters),
  });

  return {
    states: statesResponse?.data,
    meta: statesResponse?.meta,
    isLoading,
    error,
    refetch,
  };
}

// ====================================================================
// 🏙️ CITIES HOOK
// ====================================================================
export function useCities(filters?: CityFilters) {
  const {
    data: citiesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...citiesListQueryOptions(filters),
  });

  return {
    cities: citiesResponse?.data,
    meta: citiesResponse?.meta,
    isLoading,
    error,
    refetch,
  };
}

// ====================================================================
// 🌐 REGIONS HOOK
// ====================================================================
export function useRegions(filters?: RegionFilters) {
  const {
    data: regionsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...regionsListQueryOptions(filters),
  });

  return {
    regions: regionsResponse?.data,
    meta: regionsResponse?.meta,
    isLoading,
    error,
    refetch,
  };
}

// ====================================================================
// 🗺️ SUBREGIONS HOOK
// ====================================================================
export function useSubregions(filters?: SubregionFilters) {
  const {
    data: subregionsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...subregionsListQueryOptions(filters),
  });

  return {
    subregions: subregionsResponse?.data,
    meta: subregionsResponse?.meta,
    isLoading,
    error,
    refetch,
  };
}