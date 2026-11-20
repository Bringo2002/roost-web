import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../services/users';

const POLL_INTERVAL_MS = 30_000;

export function useUnreadCount(): number {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const n = await getUnreadCount();
        if (!cancelled) setCount(n);
      } catch { /* badge is non-critical */ }
    };
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isAuthenticated]);

  return count;
}
