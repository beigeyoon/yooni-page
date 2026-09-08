import { describe, expect, it } from 'vitest';
import {
  appendItem,
  isSameOrder,
  moveItem,
  removeItem,
  sortSeriesPosts
} from './seriesEditor';

describe('sortSeriesPosts', () => {
  it('순번 있는 글은 순번 순, 없는 글은 뒤에 게시일 순으로 놓는다', () => {
    const posts = [
      { id: 'c', seriesOrder: null, createdAt: '2026-01-03T00:00:00', publishedAt: '2026-01-03T00:00:00' },
      { id: 'b', seriesOrder: 2, createdAt: '2026-01-01T00:00:00', publishedAt: '2026-01-01T00:00:00' },
      { id: 'd', seriesOrder: null, createdAt: '2026-01-02T00:00:00', publishedAt: null },
      { id: 'a', seriesOrder: 1, createdAt: '2026-01-05T00:00:00', publishedAt: '2026-01-05T00:00:00' }
    ];
    expect(sortSeriesPosts(posts).map(p => p.id)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const posts = [
      { id: 'b', seriesOrder: 2, createdAt: '2026-01-01T00:00:00', publishedAt: null },
      { id: 'a', seriesOrder: 1, createdAt: '2026-01-01T00:00:00', publishedAt: null }
    ];
    sortSeriesPosts(posts);
    expect(posts.map(p => p.id)).toEqual(['b', 'a']);
  });
});

describe('moveItem', () => {
  it('위로 옮기면 바로 앞 항목과 자리를 바꾼다', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 'up')).toEqual(['a', 'c', 'b']);
  });

  it('아래로 옮기면 바로 뒤 항목과 자리를 바꾼다', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 'down')).toEqual(['b', 'a', 'c']);
  });

  it('첫 항목을 위로, 마지막 항목을 아래로 옮기면 그대로다', () => {
    const ids = ['a', 'b', 'c'];
    expect(moveItem(ids, 0, 'up')).toBe(ids);
    expect(moveItem(ids, 2, 'down')).toBe(ids);
  });
});

describe('appendItem', () => {
  it('끝에 붙인다', () => {
    expect(appendItem(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('이미 있으면 그대로다', () => {
    const ids = ['a', 'b'];
    expect(appendItem(ids, 'a')).toBe(ids);
  });
});

describe('removeItem', () => {
  it('해당 id를 뺀다', () => {
    expect(removeItem(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });
});

describe('isSameOrder', () => {
  it('같은 순서면 true', () => {
    expect(isSameOrder(['a', 'b'], ['a', 'b'])).toBe(true);
  });

  it('원소가 같아도 순서가 다르면 false', () => {
    expect(isSameOrder(['a', 'b'], ['b', 'a'])).toBe(false);
  });

  it('길이가 다르면 false', () => {
    expect(isSameOrder(['a'], ['a', 'b'])).toBe(false);
  });
});
