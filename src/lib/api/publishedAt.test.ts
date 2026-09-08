import { describe, expect, it } from 'vitest';
import { withPublishedAt } from './publishedAt';

const now = new Date('2026-09-08T07:00:00.000Z');

describe('withPublishedAt', () => {
  it('초안을 처음 게시하면 지금 시각이 게시일이 된다', () => {
    expect(withPublishedAt({ isPublished: true }, null, now)).toEqual({
      isPublished: true,
      publishedAt: '2026-09-08T07:00:00.000Z'
    });
  });

  it('이미 게시일이 있는 글은 다시 게시해도 게시일을 건드리지 않는다', () => {
    const result = withPublishedAt(
      { isPublished: true },
      '2026-09-01T00:00:00',
      now
    );
    expect(result).not.toHaveProperty('publishedAt');
  });

  it('임시저장이면 게시일을 기록하지 않는다', () => {
    expect(withPublishedAt({ isPublished: false }, null, now)).not.toHaveProperty(
      'publishedAt'
    );
  });

  it('게시 글을 임시저장으로 내려도 최초 게시일은 남겨둔다', () => {
    const result = withPublishedAt(
      { isPublished: false },
      '2026-09-01T00:00:00',
      now
    );
    expect(result).not.toHaveProperty('publishedAt');
  });

  it('이전 행을 찾지 못해 게시일을 모르면(undefined) 없는 것으로 보고 기록한다', () => {
    expect(withPublishedAt({ isPublished: true }, undefined, now)).toHaveProperty(
      'publishedAt',
      '2026-09-08T07:00:00.000Z'
    );
  });

  it('나머지 payload 필드는 그대로 통과한다', () => {
    expect(withPublishedAt({ title: '제목', isPublished: true }, null, now)).toMatchObject({
      title: '제목',
      isPublished: true
    });
  });
});
