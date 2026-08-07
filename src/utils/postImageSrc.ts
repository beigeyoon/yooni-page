// 본문 이미지를 Next.js 이미지 최적화 경로로 돌린다.
//
// 원본은 아이폰 카메라 그대로(3024x4032, 평균 2.96MB)인데 본문 컨테이너는 780px이라,
// 그대로 내려보내면 표시 폭의 4배 해상도를 전송하게 된다.
// 변환은 Vercel이 하고 결과만 CDN에 캐시되므로 원본은 그대로 남는다.

// next.config.ts의 deviceSizes 부분집합.
// 1920은 일부러 뺐다. srcset에 있으면 레티나 화면이 그걸 고르는데,
// 실측 결과 998KB로 절감이 4배까지 떨어진다. 1080이면 467KB다.
export const IMAGE_WIDTHS = [640, 828, 1080] as const;

// 본문 폭(max-w-[780px])에 가장 가까운 후보. srcset을 못 읽는 환경의 기본값이다.
export const DEFAULT_IMAGE_WIDTH = 828;

const QUALITY = 75;

// 모듈 최상단이 아니라 호출 시점에 읽는다. 최상단이면 테스트가 환경변수를
// 바꿔도 이미 평가된 값이 남는다.
function storagePrefix(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url}/storage/v1/object/public/` : '';
}

export function isOptimizableImageSrc(src: string): boolean {
  const prefix = storagePrefix();
  return prefix.length > 0 && src.startsWith(prefix);
}

export function buildOptimizedSrc(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${QUALITY}`;
}

export function buildSrcSet(src: string): string {
  return IMAGE_WIDTHS.map(
    width => `${buildOptimizedSrc(src, width)} ${width}w`
  ).join(', ');
}
