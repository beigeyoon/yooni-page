import { describe, expect, it } from 'vitest';
import { buildContentPaths } from './revalidateContent';

describe('buildContentPaths', () => {
  it('홈은 항상 포함한다', () => {
    expect(buildContentPaths()).toEqual(['/']);
  });

  it('글 하나가 바뀌면 홈·카테고리·글을 무효화한다', () => {
    expect(buildContentPaths({ category: 'travel', slug: '톨레도' })).toEqual([
      '/',
      '/travel',
      '/travel/톨레도'
    ]);
  });

  it('시리즈 소속이면 시리즈 목차도 포함한다', () => {
    expect(
      buildContentPaths({
        category: 'travel',
        slug: '톨레도',
        seriesSlug: '신혼여행'
      })
    ).toEqual(['/', '/travel', '/travel/톨레도', '/travel/series/신혼여행']);
  });

  it('시리즈를 옮기면 양쪽 시리즈를 모두 무효화한다', () => {
    const paths = buildContentPaths(
      { category: 'travel', slug: '톨레도', seriesSlug: '신혼여행' },
      { category: 'travel', slug: '톨레도', seriesSlug: '치앙마이' }
    );

    expect(paths).toContain('/travel/series/신혼여행');
    expect(paths).toContain('/travel/series/치앙마이');
  });

  it('같은 경로를 두 번 넣지 않는다', () => {
    const paths = buildContentPaths(
      { category: 'travel', slug: '톨레도' },
      { category: 'travel', slug: '톨레도' }
    );

    expect(paths).toEqual(['/', '/travel', '/travel/톨레도']);
  });

  it('카테고리가 없으면 그 위치는 건너뛴다', () => {
    expect(buildContentPaths({ category: '', slug: '톨레도' })).toEqual(['/']);
  });

  it('slug나 seriesSlug가 없어도 카테고리는 무효화한다', () => {
    expect(buildContentPaths({ category: 'dev' })).toEqual(['/', '/dev']);
  });
});
