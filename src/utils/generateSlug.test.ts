import { describe, expect, it } from 'vitest';
import { buildSlugCandidate, resolveUniqueSlug, slugify } from './generateSlug';

describe('slugify', () => {
  it('한글 제목을 하이픈으로 이어 붙인다', () => {
    expect(slugify('6개월 운영 비용')).toBe('6개월-운영-비용');
  });

  it('영문을 소문자로 바꾼다', () => {
    expect(slugify('Fetch Diff Cost')).toBe('fetch-diff-cost');
  });

  it('특수문자를 제거한다', () => {
    expect(slugify('LLM 운영기: 비용은?!')).toBe('llm-운영기-비용은');
  });

  it('연속 공백과 연속 하이픈을 하나로 합친다', () => {
    expect(slugify('a   b -- c')).toBe('a-b-c');
  });

  it('앞뒤 하이픈을 제거한다', () => {
    expect(slugify('-- 시작과 끝 --')).toBe('시작과-끝');
  });

  it('80자를 넘으면 자르고 꼬리 하이픈을 남기지 않는다', () => {
    const result = slugify('가'.repeat(50) + ' ' + '나'.repeat(50));
    expect(result.length).toBeLessThanOrEqual(80);
    expect(result.endsWith('-')).toBe(false);
  });

  it('슬러그로 만들 수 없는 제목은 빈 문자열을 반환한다', () => {
    expect(slugify('!!! ???')).toBe('');
  });
});

describe('buildSlugCandidate', () => {
  it('정상 제목은 슬러그를 그대로 쓴다', () => {
    expect(buildSlugCandidate('운영 비용', 'post')).toBe('운영-비용');
  });

  it('예약어와 겹치면 종류 접미사를 붙인다', () => {
    expect(buildSlugCandidate('series', 'post')).toBe('series-post');
    expect(buildSlugCandidate('Admin', 'series')).toBe('admin-series');
  });

  it('빈 슬러그는 종류와 임의 문자열로 대체한다', () => {
    const result = buildSlugCandidate('!!!', 'post');
    expect(result).toMatch(/^post-[0-9a-f]{8}$/);
  });
});

describe('resolveUniqueSlug', () => {
  it('중복이 없으면 후보를 그대로 반환한다', async () => {
    const result = await resolveUniqueSlug('운영-비용', async () => false);
    expect(result).toBe('운영-비용');
  });

  it('중복이면 숫자 접미사를 붙인다', async () => {
    const taken = new Set(['운영-비용', '운영-비용-2']);
    const result = await resolveUniqueSlug('운영-비용', async s => taken.has(s));
    expect(result).toBe('운영-비용-3');
  });

  it('접미사를 50까지 시도해도 실패하면 임의 문자열을 붙인다', async () => {
    const result = await resolveUniqueSlug('중복', async () => true);
    expect(result).toMatch(/^중복-[0-9a-f]{8}$/);
  });
});
