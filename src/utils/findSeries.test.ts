import { describe, expect, it } from 'vitest';
import { findSeriesByIdOrSlug } from './findSeries';

const list = [
  { id: '6b24bed8-65e7-4d21-9225-aec20f8004e0', slug: '치앙마이' },
  { id: '52ca610f-a77e-4d48-8527-62718ba84f15', slug: 'fetch-diff' }
];

describe('findSeriesByIdOrSlug', () => {
  it('UUID로 찾는다', () => {
    expect(findSeriesByIdOrSlug(list, '52ca610f-a77e-4d48-8527-62718ba84f15')).toBe(
      list[1]
    );
  });

  it('슬러그로 찾는다', () => {
    expect(findSeriesByIdOrSlug(list, 'fetch-diff')).toBe(list[1]);
  });

  it('퍼센트 인코딩된 한글 슬러그도 찾는다', () => {
    expect(findSeriesByIdOrSlug(list, encodeURIComponent('치앙마이'))).toBe(list[0]);
  });

  it('맞는 것이 없으면 undefined', () => {
    expect(findSeriesByIdOrSlug(list, '없는-시리즈')).toBeUndefined();
  });
});
