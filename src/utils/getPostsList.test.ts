import { describe, expect, it } from 'vitest';
import type { Post } from '../types';
import getPostsList from './getPostsList';

function post(overrides: Partial<Post>): Post {
  return {
    id: 'p1',
    slug: '글',
    title: '제목',
    subtitle: '부제',
    category: 'travel',
    content: '<p>본문</p>',
    isPublished: true,
    userId: 'u1',
    createdAt: '2025-06-26T14:35:54.254',
    publishedAt: null,
    ...overrides
  };
}

describe('getPostsList', () => {
  it('목록에 보이는 날짜는 초안 저장일이 아니라 게시일이다', () => {
    const [item] = getPostsList(
      [post({ publishedAt: '2026-09-08T06:13:27.099' })],
      'travel'
    );
    expect(item.publishedAt).toBe('2026. 09. 08.');
  });

  it('게시일이 없는 초안은 저장일을 보여준다', () => {
    const [item] = getPostsList([post({ isPublished: false })], 'travel');
    expect(item.publishedAt).toBe('2025. 06. 26.');
  });
});
