// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadingStore } from '@/stores/useLoadingStore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// 실제 app-dir Link는 라우터 리듀서 체인이 번들러 전용 모듈까지 끌고 와 Node에서 로드되지
// 않는다. 여기서는 Link가 지키는 계약(클라이언트 전환이 시작될 때 onNavigate를 부른다)만
// 흉내 낸다. 수식키 클릭·외부 링크·download 링크를 거르는 일은 Next 쪽 책임이다
// (next/dist/client/app-dir/link.js의 linkClicked).
vi.mock('next/link', async () => {
  const { forwardRef, createElement } = await import('react');
  type Props = {
    href: string;
    onNavigate?: (event: { preventDefault: () => void }) => void;
    children?: ReactNode;
  };
  const FakeLink = forwardRef<HTMLAnchorElement, Props>(function FakeLink(
    { href, onNavigate, children, ...rest },
    ref
  ) {
    return createElement(
      'a',
      {
        ...rest,
        ref,
        href,
        onClick: (e: MouseEvent) => {
          e.preventDefault();
          onNavigate?.({ preventDefault: () => {} });
        }
      },
      children
    );
  });
  return { default: FakeLink };
});

import AppLink from './AppLink';

let root: Root;
let container: HTMLDivElement;

async function render(ui: ReactNode) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(ui);
  });
}

function click(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

beforeEach(() => {
  useLoadingStore.setState({ isRouting: false, showLoading: false });
  window.history.replaceState({}, '', '/dev');
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('AppLink', () => {
  it('다른 페이지로 전환이 시작되면 라우팅 상태를 켠다', async () => {
    await render(<AppLink href="/talk">talk</AppLink>);
    const anchor = container.querySelector('a')!;
    expect(anchor.getAttribute('href')).toBe('/talk');

    click(anchor);

    expect(useLoadingStore.getState().isRouting).toBe(true);
  });

  // Next는 같은 주소 클릭에도 이동을 디스패치하고, 진행 중이던 이동은 폐기한다.
  // 그때 경로는 바뀌지 않아 해제 신호가 없으므로, 여기서 직접 표시를 취소해야 한다.
  it('지금 있는 경로로의 클릭은 진행 중이던 이동 표시를 취소한다', async () => {
    await render(<AppLink href="/dev">dev</AppLink>);
    useLoadingStore.getState().setIsRouting(true);

    click(container.querySelector('a')!);

    expect(useLoadingStore.getState().isRouting).toBe(false);
  });

  // 해제 신호는 경로(pathname) 변경뿐이라, 쿼리만 바뀌는 이동에는 표시를 켜지 않는다.
  it('쿼리만 다른 같은 경로는 켜지 않는다', async () => {
    await render(<AppLink href="/dev?page=2">2</AppLink>);

    click(container.querySelector('a')!);

    expect(useLoadingStore.getState().isRouting).toBe(false);
  });

  it('소비자가 넘긴 onNavigate도 그대로 불린다', async () => {
    const onNavigate = vi.fn();
    await render(
      <AppLink href="/talk" onNavigate={onNavigate}>
        talk
      </AppLink>
    );

    click(container.querySelector('a')!);

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(useLoadingStore.getState().isRouting).toBe(true);
  });

  it('소비자 onNavigate가 preventDefault하면 이동이 취소되므로 켜지 않는다', async () => {
    await render(
      <AppLink href="/talk" onNavigate={event => event.preventDefault()}>
        talk
      </AppLink>
    );

    click(container.querySelector('a')!);

    expect(useLoadingStore.getState().isRouting).toBe(false);
  });
});
