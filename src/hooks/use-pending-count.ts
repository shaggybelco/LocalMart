import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAdmin } from './use-admin';

// Each hook instance needs a unique channel name so multiple
// mounted components don't share a channel that's already subscribed.
let instanceId = 0;

export function usePendingCount() {
  const { isAdmin } = useAdmin();
  const [count, setCount] = useState(0);
  const channelName = useRef(`pending-businesses-${++instanceId}`);

  const fetchCount = async () => {
    const { count: c } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('verified', false);
    setCount(c ?? 0);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchCount();

    const channel = supabase
      .channel(channelName.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => fetchCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  return count;
}
