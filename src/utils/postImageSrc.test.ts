import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildOptimizedSrc,
  buildSrcSet,
  isOptimizableImageSrc,
  IMAGE_WIDTHS
} from './postImageSrc';

const SUPABASE = 'https://pkcsbguvrcjetmuabppk.supabase.co';
const IMAGE = `${SUPABASE}/storage/v1/object/public/images/photo.jpg`;

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE);
});

describe('isOptimizableImageSrc', () => {
  it('Supabase 스토리지 이미지는 변환 대상이다', () => {
    expect(isOptimizableImageSrc(IMAGE)).toBe(true);
  });

  it('외부 이미지는 건드리지 않는다', () => {
    expect(isOptimizableImageSrc('https://example.com/a.jpg')).toBe(false);
  });

  it('data URI는 건드리지 않는다', () => {
    expect(isOptimizableImageSrc('data:image/png;base64,AAAA')).toBe(false);
  });

  it('같은 호스트라도 스토리지 경로가 아니면 제외한다', () => {
    expect(isOptimizableImageSrc(`${SUPABASE}/rest/v1/post`)).toBe(false);
  });

  it('환경변수가 없으면 아무것도 변환하지 않는다', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(isOptimizableImageSrc(IMAGE)).toBe(false);
  });
});

describe('buildOptimizedSrc', () => {
  it('원본 URL을 인코딩해 넣고 폭과 품질을 붙인다', () => {
    expect(buildOptimizedSrc(IMAGE, 828)).toBe(
      `/_next/image?url=${encodeURIComponent(IMAGE)}&w=828&q=75`
    );
  });
});

describe('buildSrcSet', () => {
  it('후보 폭마다 항목을 만든다', () => {
    const srcset = buildSrcSet(IMAGE);
    expect(srcset.split(', ')).toHaveLength(IMAGE_WIDTHS.length);
    expect(srcset).toContain('&w=640&q=75 640w');
    expect(srcset).toContain('&w=1080&q=75 1080w');
  });

  it('레티나가 고를 1920px 후보는 넣지 않는다', () => {
    expect(buildSrcSet(IMAGE)).not.toContain('1920w');
  });
});
