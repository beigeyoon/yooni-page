'use client';

import { useEffect } from 'react';
import { useLoadingStore } from '@/stores/useLoadingStore';

export default function GlobalRouteLoading() {
  const setShowLoading = useLoadingStore(state => state.setShowLoading);

  useEffect(() => {
    setShowLoading(true);
    
    return () => setShowLoading(false);
  }, [setShowLoading]);

  return null;
}