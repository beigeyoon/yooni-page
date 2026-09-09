// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadingStore } from '@/stores/useLoadingStore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const nav = vi.hoisted(() => ({ pathname: '/admin', push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => nav.pathname
}));

import { useRouteWithLoading } from './useRouteWithLoading';

let root: Root;
let container: HTMLDivElement;
let api: ReturnType<typeof useRouteWithLoading>;

function Probe() {
  api = useRouteWithLoading();
  return null;
}

beforeEach(async () => {
  useLoadingStore.setState({ isRouting: false, showLoading: false });
  nav.push.mockReset();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<Probe />);
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('useRouteWithLoading.push', () => {
  it('다른 경로로 이동하면 라우팅 상태를 켜고 이동한다', () => {
    act(() => api.push('/editor'));

    expect(useLoadingStore.getState().isRouting).toBe(true);
    expect(nav.push).toHaveBeenCalledWith('/editor');
  });

  // 같은 경로로의 이동은 경로가 바뀌지 않아 해제 신호가 오지 않는다. 표시 없이 이동만 한다.
  it('지금 있는 경로로의 이동은 표시를 켜지 않고 이동만 한다', () => {
    act(() => api.push('/admin'));

    expect(useLoadingStore.getState().isRouting).toBe(false);
    expect(nav.push).toHaveBeenCalledWith('/admin');
  });
});
