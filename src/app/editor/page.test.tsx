// @vitest-environment jsdom
import { act, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '@/types';

// 글 수정 페이지에서는 세션 확인, 에디터 청크 로드, 글 조회가 각각 따로 끝난다.
// tiptap은 content를 에디터 생성 시점에만 읽으므로, 글 조회가 가장 늦게 끝나면
// 본문이 빈 채로 남는다. 아래 테스트는 그 순서를 고정해 재현한다.

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  search: new URLSearchParams(),
  getPostForPreview: vi.fn<(id: string) => Promise<{ data: Post }>>()
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.search,
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/editor'
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'admin', isAdmin: true } },
    status: 'authenticated'
  })
}));

// next/dynamic은 Next 라우터 컨텍스트가 필요해 React.lazy로 대신한다.
// ssr:false 동적 로드처럼 "한 틱 뒤에" 마운트되는 성질만 유지한다.
vi.mock('next/dynamic', async () => {
  const { Suspense, createElement, lazy } = await import('react');
  type Loaded =
    | ComponentType<Record<string, unknown>>
    | { default: ComponentType<Record<string, unknown>> };
  return {
    default: (loader: () => Promise<Loaded>) => {
      const Lazy = lazy(async () => {
        const mod = await loader();
        return { default: typeof mod === 'function' ? mod : mod.default };
      });
      return (props: Record<string, unknown>) =>
        createElement(Suspense, { fallback: null }, createElement(Lazy, props));
    }
  };
});

vi.mock('@/lib/api/posts', () => ({
  getPostForPreview: mocks.getPostForPreview,
  createPost: vi.fn(),
  updatePost: vi.fn()
}));

vi.mock('@/lib/api/series', () => ({
  getSeries: vi.fn(async () => ({ data: [] })),
  createSeries: vi.fn(),
  updateSeries: vi.fn()
}));

// 툴바는 이미지 업로드, HEIC 변환 같은 브라우저 전용 의존성을 끌고 오며 본문 표시와 무관하다.
vi.mock('@/components/TiptapEditor/Toolbar', () => ({ default: () => null }));

import EditorPage from './page';

const post: Post = {
  id: 'post-1',
  slug: 'post-1',
  title: '제목',
  subtitle: '부제',
  category: 'dev',
  content: '<p>본문</p>',
  isPublished: true,
  userId: 'admin',
  createdAt: '2026-01-01T00:00:00',
  publishedAt: '2026-01-01T00:00:00'
};

let root: Root;
let container: HTMLDivElement;

// 운영 QueryProvider와 같은 캐시 정책. retry만 끈다(재시도 지연이 테스트를 느리게 한다).
function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, gcTime: 5 * 60 * 1000, retry: false }
    }
  });
}

function render(client = makeClient()) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  return act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <EditorPage />
      </QueryClientProvider>
    );
  });
}

// 지연 로드와 쿼리 결과 반영처럼 다음 틱에 끝나는 일을 모두 흘려보낸다.
async function flush() {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }
}

function editorBody() {
  return container.querySelector('.ProseMirror');
}

async function unmount() {
  await act(async () => root.unmount());
  container.remove();
}

// 글 조회를 테스트가 원하는 시점에 끝낼 수 있게 붙잡아 둔다.
function deferPost() {
  let resolve!: (value: { data: Post }) => void;
  let reject!: (reason: Error) => void;
  mocks.getPostForPreview.mockReturnValue(
    new Promise<{ data: Post }>((res, rej) => {
      resolve = res;
      reject = rej;
    })
  );
  return { resolve, reject };
}

// 에디터 모듈의 최초 import는 수백 ms가 걸려 "청크가 아직 안 온" 상태를 흉내 낸다.
// 테스트는 "청크는 먼저 왔고 글 조회만 늦은" 순서를 다루므로 미리 로드해 둔다.
beforeAll(async () => {
  await import('@/components/TiptapEditor');
});

beforeEach(() => {
  mocks.search = new URLSearchParams();
  mocks.getPostForPreview.mockReset();
});

afterEach(async () => {
  await unmount();
  onlineManager.setOnline(true);
});

describe('글 수정 페이지: 본문 로드 순서', () => {
  it('글 조회가 끝나기 전에는 에디터를 만들지 않는다', async () => {
    mocks.search = new URLSearchParams('id=post-1');
    deferPost();

    await render();
    await flush();

    expect(editorBody()).toBeNull();
    expect(container.textContent).toContain('Loading...');
  });

  it('글 조회가 가장 늦게 끝나도 본문이 에디터에 표시된다', async () => {
    mocks.search = new URLSearchParams('id=post-1');
    const pending = deferPost();

    await render();
    await flush(); // 지연 로드는 끝났고 글 조회만 남은 상태
    pending.resolve({ data: post });
    await flush();

    expect(editorBody()?.textContent).toBe('본문');
  });

  it('글 조회에 실패하면 빈 에디터 대신 실패 문구를 보여준다', async () => {
    mocks.search = new URLSearchParams('id=post-1');
    const pending = deferPost();

    await render();
    pending.reject(new Error('게시글을 찾을 수 없습니다.'));
    await flush();

    expect(editorBody()).toBeNull();
    expect(container.textContent).toContain('게시글을 불러오지 못했습니다');
  });

  it('오프라인이라 조회가 멈춰 있으면 실패 문구가 아니라 로딩 상태를 보여준다', async () => {
    mocks.search = new URLSearchParams('id=post-1');
    deferPost();
    onlineManager.setOnline(false);

    await render();
    await flush();

    expect(editorBody()).toBeNull();
    expect(container.textContent).toContain('Loading...');
    expect(container.textContent).not.toContain('게시글을 불러오지 못했습니다');
  });

  it('같은 글을 다시 열면 캐시된 이전 본문이 아니라 새로 조회한 본문을 보여준다', async () => {
    mocks.search = new URLSearchParams('id=post-1');
    const client = makeClient();

    const first = deferPost();
    await render(client);
    first.resolve({ data: { ...post, content: '<p>이전 본문</p>' } });
    await flush();
    expect(editorBody()?.textContent).toBe('이전 본문');

    // 저장하고 나갔다가(캐시는 그대로) 다시 들어온다
    await unmount();
    await flush();
    const second = deferPost();
    await render(client);
    await flush();
    second.resolve({ data: { ...post, content: '<p>새 본문</p>' } });
    await flush();

    expect(editorBody()?.textContent).toBe('새 본문');
  });

  it('새 글 작성(id 없음)에서는 바로 빈 에디터를 만든다', async () => {
    await render();
    await flush();

    expect(editorBody()).not.toBeNull();
    expect(mocks.getPostForPreview).not.toHaveBeenCalled();
  });
});
