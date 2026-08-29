import { useState, useEffect } from "react";

/**
 * Delays a value update by `delay` milliseconds.
 * Useful for debouncing API requests while typing, search queries,
 * and other high-frequency events.
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * useEffect(() => {
 *   if (debouncedSearch) fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
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
