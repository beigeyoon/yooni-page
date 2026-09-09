'use client';

import Link from 'next/link';
import { forwardRef, type ComponentProps, type ComponentRef } from 'react';
import { useLoadingStore } from '@/stores/useLoadingStore';

// href는 문자열만 받는다. 아래 같은 경로 판정이 문자열을 전제한다.
type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

// 해제 신호는 GlobalLoading이 보는 경로(pathname) 변경뿐이다. 경로가 같은 이동(현재 메뉴
// 재클릭, 쿼리만 바뀌는 이동)에는 그 신호가 오지 않으므로 표시를 켜면 안 된다.
function isSamePathname(href: string) {
  return new URL(href, window.location.href).pathname === window.location.pathname;
}

// next/link에 전역 로딩 오버레이를 붙인 링크. onNavigate는 실제 클라이언트 전환이
// 시작될 때만 불린다(수식키 클릭, 외부 링크, download 링크는 제외).
const AppLink = forwardRef<ComponentRef<typeof Link>, Props>(function AppLink(
  { onNavigate, ...props },
  ref
) {
  const setIsRouting = useLoadingStore(state => state.setIsRouting);

  return (
    <Link
      ref={ref}
      {...props}
      onNavigate={event => {
        let prevented = false;
        onNavigate?.({
          preventDefault() {
            prevented = true;
            event.preventDefault();
          }
        });
        if (prevented) return;
        // Next는 같은 경로 클릭에도 이동을 디스패치하고 진행 중이던 이동을 폐기한다.
        // 그때는 경로가 바뀌지 않아 해제 신호가 없으므로 여기서 표시를 취소한다.
        setIsRouting(!isSamePathname(props.href));
      }}
    />
  );
});

export default AppLink;
