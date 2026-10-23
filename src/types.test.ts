import { describe, expect, it } from 'vitest';
import { isPublicCategory, isValidCategory } from './types';

describe('isPublicCategory', () => {
  it('공개 중인 카테고리만 통과시킨다', () => {
    for (const category of ['dev', 'travel', 'talk']) {
      expect(isPublicCategory(category)).toBe(true);
    }
  });

  it('닫아둔 photo는 저장은 가능해도 공개되지 않는다', () => {
    expect(isValidCategory('photo')).toBe(true);
    expect(isPublicCategory('photo')).toBe(false);
  });

  it('없는 카테고리는 막는다', () => {
    expect(isPublicCategory('admin')).toBe(false);
    expect(isPublicCategory(undefined)).toBe(false);
  });
});
