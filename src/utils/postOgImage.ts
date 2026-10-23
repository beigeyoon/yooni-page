// 본문의 첫 번째 사진을 링크 미리보기(OG) 이미지로 쓴다.
//
// 원본은 아이폰 카메라 그대로(평균 2.96MB)라 카카오톡 같은 크롤러가
// 받다가 포기하거나 미리보기가 늦게 뜬다. 본문과 같은 최적화 경로로
// 1080px로 줄여 내보낸다. 크롤러는 사이트 밖에서 요청하므로 절대 URL이어야 한다.
//
// 세로 사진은 미리보기 카드(약 1.91:1)에서 플랫폼이 가운데를 잘라 보여준다.
// 의도된 동작이다.

import { buildOptimizedSrc, isOptimizableImageSrc } from './postImageSrc';

const OG_IMAGE_WIDTH = 1080;

const IMG_SRC = /<img\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

function getPostOgImage(html: string, siteUrl: string): string | null {
  for (const match of html.matchAll(IMG_SRC)) {
    const src = match[1] ?? match[2] ?? match[3] ?? '';

    // data URI나 상대 경로는 크롤러가 받을 수 없으므로 건너뛴다
    if (!/^https?:\/\//i.test(src)) continue;

    if (isOptimizableImageSrc(src)) {
      return `${siteUrl}${buildOptimizedSrc(src, OG_IMAGE_WIDTH)}`;
    }
    return src;
  }

  return null;
}

export default getPostOgImage;
