import { useState, useEffect, useCallback } from 'react';
import { getSavedProperties, saveProperty, unsaveProperty } from '../services/properties';
import type { Property } from '../types/property';

export function useSavedProperties() {
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSaved = useCallback(async () => {
    setIsLoading(true);
    try {
      const props = await getSavedProperties();
      setSavedProperties(props);
      setSavedIds(new Set(props.map(p => p.id)));
    } catch { /* saved state non-critical */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const toggle = useCallback(async (id: number) => {
    const wasSaved = savedIds.has(id);
    setSavedIds(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id); else next.add(id);
      return next;
    });
    try {
      if (wasSaved) await unsaveProperty(id);
      else await saveProperty(id);
    } catch {
      setSavedIds(prev => {
        const next = new Set(prev);
        if (wasSaved) next.add(id); else next.delete(id);
        return next;
      });
    }
  }, [savedIds]);

  const isSaved = useCallback((id: number) => savedIds.has(id), [savedIds]);

  return { savedProperties, savedIds, isLoading, isSaved, toggle, refetch: fetchSaved };
}
