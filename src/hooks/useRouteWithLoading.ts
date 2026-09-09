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
    // 같은 경로로의 이동은 경로가 바뀌지 않아 해제 신호가 오지 않는다. 표시 없이 이동만 한다.
    const samePathname = new URL(url, window.location.href).pathname === pathname;
    setIsRouting(!samePathname);
    startTransition(() => {
      router.push(url);
    });
  };

  return { push };
};