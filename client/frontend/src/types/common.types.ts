export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  field: string;
  value: string | number | boolean;
  operator?: 'eq' | 'neq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte';
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface FileWithPreview {
  file: File;
  preview?: string;
  progress?: number;
  uploaded?: boolean;
  error?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}
