'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';

// 관리자 화면 공통 게이트.
// 세션 확인이 끝났는데 관리자가 아니면 홈으로 보낸다.
// 로딩 중에는 아무것도 하지 않으므로, 호출한 쪽은 canAccessAdmin이 false인 동안 빈 화면을 그린다.
export function useAdminGate() {
  const { isAdmin, status } = useAuth();
  const router = useRouteWithLoading();
  const canAccessAdmin = status === 'authenticated' && isAdmin;

  useEffect(() => {
    if (status === 'loading') return;
    if (!canAccessAdmin) router.push('/');
  }, [canAccessAdmin, router, status]);

  return { canAccessAdmin, status };
}
