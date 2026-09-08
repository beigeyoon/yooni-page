import { describe, expect, it } from 'vitest';
import { getPostDate } from './postDate';

describe('getPostDate', () => {
  it('게시일이 있으면 게시일을 글의 시각으로 쓴다', () => {
    expect(
      getPostDate({
        createdAt: '2025-06-26T14:35:54.254',
        publishedAt: '2026-09-08T06:13:27.099'
      })
    ).toBe('2026-09-08T06:13:27.099');
  });

  it('게시일이 없는 초안은 저장일로 대신한다', () => {
    expect(
      getPostDate({ createdAt: '2025-06-26T14:35:54.254', publishedAt: null })
    ).toBe('2025-06-26T14:35:54.254');
  });
});
