import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { checkIsAdmin } from '@/services/admin';

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    checkIsAdmin()
      .then(result => { setIsAdmin(result); setLoading(false); })
      .catch(() => { setIsAdmin(false); setLoading(false); });
  }, [user, authLoading]);

  return { isAdmin, loading };
}
