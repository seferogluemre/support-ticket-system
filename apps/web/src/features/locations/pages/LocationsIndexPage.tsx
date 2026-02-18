import { DataTable } from '#/components/data-table';
import { PageContainer } from '#/components/layout/page-container';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs';
import { type PaginationState } from '@tanstack/react-table';
import { Building2, Globe, Layers, Map, MapPin, RotateCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cityColumns } from '../columns/city.columns';
import { countryColumns } from '../columns/country.columns';
import { regionColumns } from '../columns/region.columns';
import { stateColumns } from '../columns/state.columns';
import { subregionColumns } from '../columns/subregion.columns';
import { useCities, useCountries, useRegions, useStates, useSubregions } from '../hooks/use-locations';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ====================================================================
// 🌍 COUNTRIES TAB
// ====================================================================
function CountriesTab() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearch = useDebounce(searchKeyword, 300);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  const { countries, meta, isLoading, refetch } = useCountries({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });

  const handleResetFilters = () => {
    setSearchKeyword('');
    setPagination({ pageIndex: 0, pageSize: 20 });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              className="pl-9 w-64"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="h-10">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button variant="outline" onClick={() => refetch()} className="h-10">
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={countryColumns}
            data={countries || []}
            isLoading={isLoading}
            manualPagination
            pageCount={meta?.pageCount ?? -1}
            pagination={pagination}
            onPaginationChange={setPagination}
            emptyMessage="No countries found."
          />
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {meta && (
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.pageIndex * pagination.pageSize) + 1} to{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, meta.total)} of{' '}
          {meta.total} countries
        </div>
      )}
    </div>
  );
}

// ====================================================================
// 🏛️ STATES TAB
// ====================================================================
function StatesTab() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearch = useDebounce(searchKeyword, 300);
  const [countryIdFilter, setCountryIdFilter] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Fetch countries for filter dropdown
  const { countries: countryOptions } = useCountries({ perPage: 250 });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, countryIdFilter]);

  const { states, meta, isLoading, refetch } = useStates({
    search: debouncedSearch || undefined,
    countryId: countryIdFilter ? parseInt(countryIdFilter) : undefined,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });

  const handleResetFilters = () => {
    setSearchKeyword('');
    setCountryIdFilter('');
    setPagination({ pageIndex: 0, pageSize: 20 });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              className="pl-9 w-64"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Country</label>
          <Select
            value={countryIdFilter || 'all'}
            onValueChange={(value) => setCountryIdFilter(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countryOptions?.map((country) => (
                <SelectItem key={country.id} value={country.id.toString()}>
                  {country.emoji} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="h-10">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button variant="outline" onClick={() => refetch()} className="h-10">
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={stateColumns}
            data={states || []}
            isLoading={isLoading}
            manualPagination
            pageCount={meta?.pageCount ?? -1}
            pagination={pagination}
            onPaginationChange={setPagination}
            emptyMessage="No states found."
          />
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {meta && (
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.pageIndex * pagination.pageSize) + 1} to{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, meta.total)} of{' '}
          {meta.total} states
        </div>
      )}
    </div>
  );
}

// ====================================================================
// 🏙️ CITIES TAB
// ====================================================================
function CitiesTab() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearch = useDebounce(searchKeyword, 300);
  const [countryIdFilter, setCountryIdFilter] = useState<string>('');
  const [stateIdFilter, setStateIdFilter] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Fetch countries for filter dropdown
  const { countries: countryOptions } = useCountries({ perPage: 250 });
  
  // Fetch states based on selected country
  const { states: stateOptions } = useStates({ 
    countryId: countryIdFilter ? parseInt(countryIdFilter) : undefined,
    perPage: 250,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, countryIdFilter, stateIdFilter]);

  // Reset state filter when country changes
  useEffect(() => {
    setStateIdFilter('');
  }, [countryIdFilter]);

  const { cities, meta, isLoading, refetch } = useCities({
    search: debouncedSearch || undefined,
    countryId: countryIdFilter ? parseInt(countryIdFilter) : undefined,
    stateId: stateIdFilter ? parseInt(stateIdFilter) : undefined,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });

  const handleResetFilters = () => {
    setSearchKeyword('');
    setCountryIdFilter('');
    setStateIdFilter('');
    setPagination({ pageIndex: 0, pageSize: 20 });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              className="pl-9 w-64"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Country</label>
          <Select
            value={countryIdFilter || 'all'}
            onValueChange={(value) => setCountryIdFilter(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countryOptions?.map((country) => (
                <SelectItem key={country.id} value={country.id.toString()}>
                  {country.emoji} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">State</label>
          <Select
            value={stateIdFilter || 'all'}
            onValueChange={(value) => setStateIdFilter(value === 'all' ? '' : value)}
            disabled={!countryIdFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={countryIdFilter ? "All States" : "Select country first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {stateOptions?.map((state) => (
                <SelectItem key={state.id} value={state.id.toString()}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="h-10">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button variant="outline" onClick={() => refetch()} className="h-10">
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={cityColumns}
            data={cities || []}
            isLoading={isLoading}
            manualPagination
            pageCount={meta?.pageCount ?? -1}
            pagination={pagination}
            onPaginationChange={setPagination}
            emptyMessage="No cities found."
          />
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {meta && (
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.pageIndex * pagination.pageSize) + 1} to{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, meta.total)} of{' '}
          {meta.total} cities
        </div>
      )}
    </div>
  );
}

// ====================================================================
// 🌐 REGIONS TAB
// ====================================================================
function RegionsTab() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearch = useDebounce(searchKeyword, 300);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  const { regions, meta, isLoading, refetch } = useRegions({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });

  const handleResetFilters = () => {
    setSearchKeyword('');
    setPagination({ pageIndex: 0, pageSize: 20 });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              className="pl-9 w-64"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="h-10">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button variant="outline" onClick={() => refetch()} className="h-10">
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={regionColumns}
            data={regions || []}
            isLoading={isLoading}
            manualPagination
            pageCount={meta?.pageCount ?? -1}
            pagination={pagination}
            onPaginationChange={setPagination}
            emptyMessage="No regions found."
          />
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {meta && (
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.pageIndex * pagination.pageSize) + 1} to{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, meta.total)} of{' '}
          {meta.total} regions
        </div>
      )}
    </div>
  );
}

// ====================================================================
// 🗺️ SUBREGIONS TAB
// ====================================================================
function SubregionsTab() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearch = useDebounce(searchKeyword, 300);
  const [regionIdFilter, setRegionIdFilter] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Fetch regions for filter dropdown
  const { regions: regionOptions } = useRegions({ perPage: 50 });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, regionIdFilter]);

  const { subregions, meta, isLoading, refetch } = useSubregions({
    search: debouncedSearch || undefined,
    regionId: regionIdFilter ? parseInt(regionIdFilter) : undefined,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });

  const handleResetFilters = () => {
    setSearchKeyword('');
    setRegionIdFilter('');
    setPagination({ pageIndex: 0, pageSize: 20 });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              className="pl-9 w-64"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Region</label>
          <Select
            value={regionIdFilter || 'all'}
            onValueChange={(value) => setRegionIdFilter(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regionOptions?.map((region) => (
                <SelectItem key={region.id} value={region.id.toString()}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="h-10">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button variant="outline" onClick={() => refetch()} className="h-10">
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={subregionColumns}
            data={subregions || []}
            isLoading={isLoading}
            manualPagination
            pageCount={meta?.pageCount ?? -1}
            pagination={pagination}
            onPaginationChange={setPagination}
            emptyMessage="No subregions found."
          />
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {meta && (
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.pageIndex * pagination.pageSize) + 1} to{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, meta.total)} of{' '}
          {meta.total} subregions
        </div>
      )}
    </div>
  );
}

// ====================================================================
// 📍 MAIN LOCATIONS PAGE
// ====================================================================
export default function LocationsIndexPage() {
  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Locations</h1>
          </div>
          <p className="text-muted-foreground">
            Browse geographic data including countries, states, cities, regions, and subregions.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="countries" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="countries" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Countries</span>
            </TabsTrigger>
            <TabsTrigger value="states" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">States</span>
            </TabsTrigger>
            <TabsTrigger value="cities" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Cities</span>
            </TabsTrigger>
            <TabsTrigger value="regions" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Regions</span>
            </TabsTrigger>
            <TabsTrigger value="subregions" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Subregions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="countries" className="mt-6">
            <CountriesTab />
          </TabsContent>

          <TabsContent value="states" className="mt-6">
            <StatesTab />
          </TabsContent>

          <TabsContent value="cities" className="mt-6">
            <CitiesTab />
          </TabsContent>

          <TabsContent value="regions" className="mt-6">
            <RegionsTab />
          </TabsContent>

          <TabsContent value="subregions" className="mt-6">
            <SubregionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}