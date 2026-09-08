import isUuid from '../../utils/isUuid';
import type { ContentLocation } from '../revalidateContent';

export type ParsedSeriesPostIds =
  | { ok: true; postIds: string[] }
  | { ok: false; error: string };

// PUT /api/series/posts 본문의 형식 검사.
// 글의 존재 여부와 카테고리는 DB가 필요하므로 라우트에서 본다.
export function parseSeriesPostIds(body: unknown): ParsedSeriesPostIds {
  const postIds = (body as { postIds?: unknown } | null)?.postIds;

  if (
    !Array.isArray(postIds) ||
    !postIds.every((id): id is string => typeof id === 'string')
  ) {
    return { ok: false, error: 'postIds는 문자열 배열이어야 합니다.' };
  }
  if (!postIds.every(id => isUuid(id))) {
    return { ok: false, error: '올바르지 않은 글 id가 있습니다.' };
  }
  if (new Set(postIds).size !== postIds.length) {
    return { ok: false, error: '같은 글이 두 번 들어 있습니다.' };
  }
  return { ok: true, postIds };
}

type SeriesRef = { category: string; slug: string };
type PostRef = { category: string; slug: string };

// 저장 후 낡는 페이지: 이 시리즈(홈·카테고리 포함), 영향받은 글 전부, 글을 빼앗긴 다른 시리즈.
// 경로 중복은 buildContentPaths가 걸러내므로 여기서는 신경 쓰지 않는다.
export function buildSeriesPostLocations(
  series: SeriesRef,
  posts: PostRef[],
  otherSeries: SeriesRef[]
): ContentLocation[] {
  return [
    { category: series.category, seriesSlug: series.slug },
    ...posts.map(post => ({ category: post.category, slug: post.slug })),
    ...otherSeries.map(other => ({
      category: other.category,
      seriesSlug: other.slug
    }))
  ];
}
