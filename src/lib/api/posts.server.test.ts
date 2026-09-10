import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '@/types';

// 목록 조회가 Supabase에 어떤 컬럼을 요청하는지만 본다.
// 목록 페이지는 조회 결과를 통째로 dehydrate해 HTML에 싣기 때문에,
// 본문(content)이 섞여 들어오면 페이지 하나가 수백 KB로 불어난다.
const calls = vi.hoisted(() => ({ select: [] as string[] }));

vi.mock('@/lib/supabasePublic', () => {
  function builder() {
    const b: Record<string, unknown> = {};
    const chain = () => b;
    b.from = chain;
    b.eq = chain;
    b.order = chain;
    b.select = (columns: string) => {
      calls.select.push(columns);
      return b;
    };
    // supabase 빌더는 thenable이라 await 시점에 실행된다. 여기서는 빈 결과를 돌려준다.
    b.then = (resolve: (value: unknown) => void) =>
      resolve({ data: [], error: null });
    return b;
  }
  return { getSupabasePublic: () => builder() };
});

import { getPostsBySeriesForServer, getPostsForServer } from './posts.server';

// content를 뺀 Post의 모든 컬럼. 타입에 필드가 늘면 이 목록도 같이 늘어야 한다.
const LIST_COLUMNS: (keyof Omit<Post, 'content'>)[] = [
  'id',
  'slug',
  'title',
  'subtitle',
  'category',
  'seriesId',
  'seriesOrder',
  'isPublished',
  'userId',
  'createdAt',
  'publishedAt'
];

function requestedColumns(): string[] {
  expect(calls.select).toHaveLength(1);
  return calls.select[0].split(',').map(column => column.trim());
}

beforeEach(() => {
  calls.select.length = 0;
});

describe('getPostsForServer', () => {
  it('photo가 아닌 카테고리 목록은 본문 없이 나머지 컬럼만 요청한다', async () => {
    await getPostsForServer('dev');

    const columns = requestedColumns();
    expect(columns).not.toContain('content');
    expect(columns).not.toContain('*');
    for (const column of LIST_COLUMNS) {
      expect(columns).toContain(column);
    }
  });

  it('photo 목록은 대표 이미지를 본문에서 뽑으므로 본문을 포함한다', async () => {
    await getPostsForServer('photo');

    expect(requestedColumns()).toEqual(['*']);
  });
});

describe('getPostsBySeriesForServer', () => {
  it('시리즈 목록은 기본적으로 본문을 요청하지 않는다', async () => {
    await getPostsBySeriesForServer('series-1');

    const columns = requestedColumns();
    expect(columns).not.toContain('content');
    expect(columns).not.toContain('*');
    for (const column of LIST_COLUMNS) {
      expect(columns).toContain(column);
    }
  });

  it('withContent를 주면 본문까지 요청한다', async () => {
    await getPostsBySeriesForServer('series-1', { withContent: true });

    expect(requestedColumns()).toEqual(['*']);
  });
});
