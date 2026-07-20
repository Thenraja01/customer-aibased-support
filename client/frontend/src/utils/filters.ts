export interface FilterState {
  search: string;
  status: string;
  priority: string;
  dateFrom: string;
  dateTo: string;
}

export const defaultFilterState: FilterState = {
  search: '',
  status: '',
  priority: '',
  dateFrom: '',
  dateTo: '',
};

export function buildFilterParams(filters: FilterState): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  return params;
}

export function isFilterActive(filters: FilterState): boolean {
  return Object.values(filters).some((v) => v !== '');
}

export function clearFilters(): FilterState {
  return { ...defaultFilterState };
}
