import { useState, useEffect, useCallback } from 'react';
import { getProperties, type PropertyFilters } from '../services/properties';
import type { Property } from '../types/property';

interface UsePropertiesResult {
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProperties(filters: PropertyFilters = {}): UsePropertiesResult {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const filtersKey = JSON.stringify(filters);
  const refetch = useCallback(() => setTrigger(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getProperties(filters)
      .then(data => { if (!cancelled) setProperties(data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load properties'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, trigger]);

  return { properties, isLoading, error, refetch };
}
