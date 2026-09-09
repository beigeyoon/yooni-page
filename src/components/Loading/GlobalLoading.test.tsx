// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadingStore } from '@/stores/useLoadingStore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const nav = vi.hoisted(() => ({ pathname: '/dev' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

import GlobalLoading from './GlobalLoading';

let root: Root;
let container: HTMLDivElement;

async function render() {
  await act(async () => {
    root.render(<GlobalLoading />);
  });
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  useLoadingStore.setState({ isRouting: false, showLoading: false });
  nav.pathname = '/dev';
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe('GlobalLoading', () => {
  it('경로가 바뀌어 새 페이지가 그려지면 오버레이를 끈다', async () => {
    await render();
    act(() => useLoadingStore.getState().setIsRouting(true));
    advance(150);
    expect(container.textContent).toContain('Loading...');

    nav.pathname = '/talk';
    await render();
    advance(300);

    expect(container.textContent).not.toContain('Loading...');
  });

  it('150ms 안에 새 경로가 그려지면 오버레이를 켜지 않는다', async () => {
    await render();
    act(() => useLoadingStore.getState().setIsRouting(true));
    advance(50);

    nav.pathname = '/talk';
    await render();
    advance(1000);

    expect(container.textContent).not.toContain('Loading...');
  });
});
