// 게시일(publishedAt)은 글이 처음 공개된 시각이다.
// 초안 저장 시점(createdAt)과 구분해서, 화면과 SEO 메타데이터가 실제 게시일을 보여주게 한다.
//
// 규칙: 비어 있을 때만 기록한다.
// - 초안 → 게시: 지금 시각을 기록
// - 게시 글을 임시저장으로 내렸다가 다시 게시: 최초 게시일 유지
// - 임시저장: 건드리지 않음
// 기록하지 않을 때는 payload에 publishedAt 키를 아예 넣지 않아, DB의 기존 값이 보존된다.
export function withPublishedAt<T extends { isPublished: boolean }>(
  payload: T,
  existingPublishedAt: string | null | undefined,
  now: Date = new Date()
): T & { publishedAt?: string } {
  if (payload.isPublished && existingPublishedAt == null) {
    return { ...payload, publishedAt: now.toISOString() };
  }
  return payload;
}
