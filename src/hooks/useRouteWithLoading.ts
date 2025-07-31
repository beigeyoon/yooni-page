'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useEffect } from 'react';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { usePathname } from 'next/navigation';

export const useRouteWithLoading = () => {
  const router = useRouter();
  const pathname = usePathname();
  const setIsRouting = useLoadingStore(s => s.setIsRouting);
  const [, startTransition] = useTransition();

  // 페이지 이동 완료 시 로딩 상태 해제
  useEffect(() => {
    setIsRouting(false);
  }, [pathname, setIsRouting]);

  const push = (url: string) => {
    setIsRouting(true);
    startTransition(() => {
      router.push(url);
    });
  };

  return { push };
};