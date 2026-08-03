// 게시글 목록 정렬 규칙을 한 곳에 모아둔다.
// posts.server.ts(RSC 조회)와 app/api/posts/route.ts(클라이언트 캐시 미스 시 직접 조회)가
// 같은 UI를 서로 다른 경로로 채우기 때문에, 정렬 기준이 어긋나면 시리즈 순서가 깨진다.
// 새로운 게시글 조회 경로를 추가할 때도 반드시 이 두 헬퍼를 사용한다.

type Orderable<T> = {
  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ): T;
};

// 시리즈는 1편부터 순서대로. 순번이 없는 글은 뒤로 밀고 작성일 순으로 잇는다.
export function orderBySeriesSequence<T extends Orderable<T>>(query: T): T {
  return query
    .order('seriesOrder', { ascending: true, nullsFirst: false })
    .order('createdAt', { ascending: true });
}

// 시리즈가 아닌 모든 목록은 최신순.
export function orderByNewest<T extends Orderable<T>>(query: T): T {
  return query.order('createdAt', { ascending: false });
}
