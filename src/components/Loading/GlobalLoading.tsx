'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLoadingStore } from '@/stores/useLoadingStore';
import LoadingOverlay from './LoadingOverlay';

const GlobalLoading = () => {
  const showLoading = useLoadingStore(state => state.showLoading);
  const setIsRouting = useLoadingStore(state => state.setIsRouting);
  const pathname = usePathname();

  // 새 경로가 그려졌으면 이동은 끝난 것이다. PageReady를 두지 않은 페이지로 가도
  // 오버레이가 남지 않도록 여기서 해제한다.
  useEffect(() => {
    setIsRouting(false);
  }, [pathname, setIsRouting]);

  if (!showLoading) return null;
  return <LoadingOverlay />;
};

export default GlobalLoading;
