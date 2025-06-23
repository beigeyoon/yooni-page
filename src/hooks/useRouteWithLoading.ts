'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useLoadingStore } from '@/stores/useLoadingStore';

export const useRouteWithLoading = () => {
  const router = useRouter();
  const setIsRouting = useLoadingStore(s => s.setIsRouting);
  const [, startTransition] = useTransition();

  const push = (url: string) => {
    setIsRouting(true);
    startTransition(() => {
      router.push(url);
    });
  };

  return { push };
};