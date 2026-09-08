import decodeSlugParam from './decodeSlugParam';

// 관리자 상세 URL은 UUID와 슬러그를 모두 받는다.
// 목록 링크는 공개 페이지와 같은 슬러그를 쓰고, 예전 UUID 링크도 그대로 동작한다.
// 동적 세그먼트는 퍼센트 인코딩된 채로 오므로 한글 슬러그는 디코딩해서 비교한다.
export function findSeriesByIdOrSlug<T extends { id: string; slug: string }>(
  list: T[],
  idOrSlug: string
): T | undefined {
  const key = decodeSlugParam(idOrSlug);
  return list.find(item => item.id === key || item.slug === key);
}
