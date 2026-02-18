import { api } from '#/lib/api';
import { queryOptions } from '@tanstack/react-query';

// ====================================================================
// Type definitions from API response
// ====================================================================

type CountryIndexQuery = {
  page?: number;
  perPage?: number;
  search?: string;
};

type StateIndexQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  countryId?: number;
};

type CityIndexQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  countryId?: number;
  stateId?: number;
};

type RegionIndexQuery = {
  page?: number;
  perPage?: number;
  search?: string;
};

type SubregionIndexQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  regionId?: number;
};

// ====================================================================
// 📋 COUNTRIES LIST QUERY
// ====================================================================
export const countriesListQueryOptions = (filters?: CountryIndexQuery) =>
  queryOptions({
    queryKey: ['locations', 'countries', filters],
    queryFn: async () => {
      const response = await api.locations.countries.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch countries');
      }

      return response.data;
    },
  });

// ====================================================================
// 📋 STATES LIST QUERY
// ====================================================================
export const statesListQueryOptions = (filters?: StateIndexQuery) =>
  queryOptions({
    queryKey: ['locations', 'states', filters],
    queryFn: async () => {
      const response = await api.locations.states.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch states');
      }

      return response.data;
    },
  });

// ====================================================================
// 📋 CITIES LIST QUERY
// ====================================================================
export const citiesListQueryOptions = (filters?: CityIndexQuery) =>
  queryOptions({
    queryKey: ['locations', 'cities', filters],
    queryFn: async () => {
      const response = await api.locations.cities.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch cities');
      }

      return response.data;
    },
  });

// ====================================================================
// 📋 REGIONS LIST QUERY
// ====================================================================
export const regionsListQueryOptions = (filters?: RegionIndexQuery) =>
  queryOptions({
    queryKey: ['locations', 'regions', filters],
    queryFn: async () => {
      const response = await api.locations.regions.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch regions');
      }

      return response.data;
    },
  });

// ====================================================================
// 📋 SUBREGIONS LIST QUERY
// ====================================================================
export const subregionsListQueryOptions = (filters?: SubregionIndexQuery) =>
  queryOptions({
    queryKey: ['locations', 'subregions', filters],
    queryFn: async () => {
      const response = await api.locations.subregions.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch subregions');
      }

      return response.data;
    },
  });