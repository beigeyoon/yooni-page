import { beforeEach, describe, expect, it, vi } from 'vitest';
import optimizePostHtml from './optimizePostHtml';

const SUPABASE = 'https://pkcsbguvrcjetmuabppk.supabase.co';
const IMAGE = `${SUPABASE}/storage/v1/object/public/images/photo.jpg`;

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE);
});

describe('optimizePostHtml', () => {
  it('첫 이미지는 eager, 나머지는 lazy로 둔다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}"><img src="${IMAGE}">`);
    const tags = html.match(/<img[^>]*>/g) ?? [];

    expect(tags[0]).toContain('loading="eager"');
    expect(tags[0]).toContain('fetchpriority="high"');
    expect(tags[1]).toContain('loading="lazy"');
    expect(tags[1]).toContain('fetchpriority="low"');
  });

  it('alt가 없으면 채워 넣는다', () => {
    expect(optimizePostHtml(`<img src="${IMAGE}">`)).toContain(
      'alt="본문 이미지 1"'
    );
  });

  it('의미 있는 alt는 보존한다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}" alt="톨레도 성당">`);
    expect(html).toContain('alt="톨레도 성당"');
    expect(html).not.toContain('본문 이미지');
  });

  it('Supabase 이미지는 최적화 경로로 바꾼다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}">`);

    expect(html).toContain('src="/_next/image?url=');
    expect(html).toContain('&amp;w=828&amp;q=75"');
    expect(html).not.toContain(`src="${IMAGE}"`);
  });

  it('srcset과 sizes를 붙인다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}">`);

    expect(html).toContain('srcset="');
    expect(html).toContain('640w');
    expect(html).toContain('1080w');
    expect(html).toContain('sizes="(max-width: 780px) 100vw, 780px"');
  });

  it('원본 URL을 url 파라미터에 보존한다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}">`);
    expect(html).toContain(encodeURIComponent(IMAGE));
  });

  it('외부 이미지는 src를 그대로 둔다', () => {
    const html = optimizePostHtml('<img src="https://example.com/a.jpg">');

    expect(html).toContain('src="https://example.com/a.jpg"');
    expect(html).not.toContain('_next/image');
    expect(html).not.toContain('srcset');
  });

  it('자기닫힘 표기를 보존한다', () => {
    expect(optimizePostHtml(`<img src="${IMAGE}" />`)).toContain('/>');
  });

  it('이미지가 없으면 원문을 그대로 돌려준다', () => {
    expect(optimizePostHtml('<p>글자만</p>')).toBe('<p>글자만</p>');
  });
});
