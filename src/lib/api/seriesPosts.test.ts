import { describe, expect, it } from 'vitest';
import { buildContentPaths } from '../revalidateContent';
import { buildSeriesPostLocations, parseSeriesPostIds } from './seriesPosts';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

describe('parseSeriesPostIds', () => {
  it('UUID 문자열 배열이면 그대로 돌려준다', () => {
    expect(parseSeriesPostIds({ postIds: [A, B] })).toEqual({
      ok: true,
      postIds: [A, B]
    });
  });

  it('빈 배열도 허용한다 (전부 뺀다는 뜻)', () => {
    expect(parseSeriesPostIds({ postIds: [] })).toEqual({ ok: true, postIds: [] });
  });

  it('배열이 아니면 거부한다', () => {
    const result = parseSeriesPostIds({ postIds: A });
    expect(result.ok).toBe(false);
  });

  it('문자열이 아닌 항목이 있으면 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: [A, 3] }).ok).toBe(false);
  });

  it('UUID가 아닌 항목이 있으면 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: ['abc'] }).ok).toBe(false);
  });

  it('중복이 있으면 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: [A, A] }).ok).toBe(false);
  });

  it('본문이 null이어도 터지지 않고 거부한다', () => {
    expect(parseSeriesPostIds(null).ok).toBe(false);
  });
});

describe('buildSeriesPostLocations', () => {
  it('시리즈, 글 전부, 글을 빼앗긴 다른 시리즈 위치를 만든다', () => {
    expect(
      buildSeriesPostLocations(
        { category: 'dev', slug: '블록체인' },
        [
          { category: 'dev', slug: '지갑' },
          { category: 'dev', slug: '노드' }
        ],
        [{ category: 'dev', slug: '개발학습' }]
      )
    ).toEqual([
      { category: 'dev', seriesSlug: '블록체인' },
      { category: 'dev', slug: '지갑' },
      { category: 'dev', slug: '노드' },
      { category: 'dev', seriesSlug: '개발학습' }
    ]);
  });

  it('buildContentPaths에 넘기면 홈·카테고리·시리즈·글 경로가 중복 없이 나온다', () => {
    const locations = buildSeriesPostLocations(
      { category: 'dev', slug: '블록체인' },
      [
        { category: 'dev', slug: '지갑' },
        { category: 'dev', slug: '노드' }
      ],
      [{ category: 'dev', slug: '개발학습' }]
    );
    expect(buildContentPaths(...locations)).toEqual([
      '/',
      '/dev',
      '/dev/series/블록체인',
      '/dev/지갑',
      '/dev/노드',
      '/dev/series/개발학습'
    ]);
  });
});
