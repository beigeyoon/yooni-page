import { beforeEach, describe, expect, it, vi } from 'vitest';
import getPostOgImage from './postOgImage';

const SITE_URL = 'https://yooni.seoul.kr';
const SUPABASE = 'https://pkcsbguvrcjetmuabppk.supabase.co';
const IMAGE = `${SUPABASE}/storage/v1/object/public/images/photo.jpg`;

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE);
});

describe('getPostOgImage', () => {
  it('스토리지 이미지는 1080px 최적화 경로의 절대 URL로 바꾼다', () => {
    const html = `<p>글</p><img src="${IMAGE}" alt="">`;

    expect(getPostOgImage(html, SITE_URL)).toBe(
      `${SITE_URL}/_next/image?url=${encodeURIComponent(IMAGE)}&w=1080&q=75`
    );
  });

  it('여러 장이면 첫 번째 이미지를 쓴다', () => {
    const second = `${SUPABASE}/storage/v1/object/public/images/second.jpg`;
    const html = `<img src="${IMAGE}"><img src="${second}">`;

    expect(getPostOgImage(html, SITE_URL)).toContain(
      encodeURIComponent(IMAGE)
    );
  });

  it('외부 이미지는 원래 주소를 그대로 쓴다', () => {
    const html = `<img alt="x" src='https://example.com/a.jpg'>`;

    expect(getPostOgImage(html, SITE_URL)).toBe('https://example.com/a.jpg');
  });

  it('data URI는 건너뛰고 다음 이미지를 쓴다', () => {
    const html = `<img src="data:image/png;base64,AAAA"><img src="https://example.com/a.jpg">`;

    expect(getPostOgImage(html, SITE_URL)).toBe('https://example.com/a.jpg');
  });

  it('이미지가 없으면 null을 돌려준다', () => {
    expect(getPostOgImage('<p>글만 있다</p>', SITE_URL)).toBeNull();
  });
});
