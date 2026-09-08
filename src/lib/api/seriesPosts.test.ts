import { describe, expect, it } from 'vitest';
import { buildContentPaths } from '../revalidateContent';
import { buildSeriesPostLocations, parseSeriesPostIds } from './seriesPosts';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
// A/B are digit-only, so A.toUpperCase() === A; use a hex-letter id here so
// the test actually exercises case-insensitive comparison.
const C = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

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
    expect(parseSeriesPostIds({ postIds: A })).toEqual({
      ok: false,
      error: 'postIds는 문자열 배열이어야 합니다.'
    });
  });

  it('문자열이 아닌 항목이 있으면 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: [A, 3] }).ok).toBe(false);
  });

  it('UUID가 아닌 항목이 있으면 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: ['abc'] })).toEqual({
      ok: false,
      error: '올바르지 않은 글 id가 있습니다.'
    });
  });

  it('중복이 있으면 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: [A, A] })).toEqual({
      ok: false,
      error: '같은 글이 두 번 들어 있습니다.'
    });
  });

  it('대소문자만 다른 중복도 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: [C, C.toUpperCase()] })).toEqual({
      ok: false,
      error: '같은 글이 두 번 들어 있습니다.'
    });
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
