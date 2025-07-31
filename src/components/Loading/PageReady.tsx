'use client';

import { useEffect } from 'react';
import { useLoadingStore } from '@/stores/useLoadingStore';

export default function PageReady() {
  const setIsRouting = useLoadingStore(s => s.setIsRouting);

  useEffect(() => {
    setIsRouting(false);
  }, [setIsRouting]);

  return null;
}