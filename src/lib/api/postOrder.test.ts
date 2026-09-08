import { describe, expect, it } from 'vitest';
import { orderByNewest, orderBySeriesSequence } from './postOrder';

// Supabase 쿼리 빌더 대신 order() 호출만 기록하는 최소 대역
function fakeQuery() {
  const calls: [string, unknown][] = [];
  const query = {
    order(column: string, options?: unknown) {
      calls.push([column, options]);
      return query;
    }
  };
  return { query, calls };
}

describe('orderByNewest', () => {
  it('최신순은 게시일 내림차순이고 게시일 없는 초안은 뒤로 보낸다', () => {
    const { query, calls } = fakeQuery();
    orderByNewest(query);
    expect(calls).toEqual([
      ['publishedAt', { ascending: false, nullsFirst: false }]
    ]);
  });
});

describe('orderBySeriesSequence', () => {
  it('순번 오름차순, 순번 없는 글은 뒤로 밀고 게시일 오름차순으로 잇는다', () => {
    const { query, calls } = fakeQuery();
    orderBySeriesSequence(query);
    expect(calls).toEqual([
      ['seriesOrder', { ascending: true, nullsFirst: false }],
      ['publishedAt', { ascending: true }]
    ]);
  });
});
