// 글에 노출하는 시각은 게시일이다. 초안은 아직 게시일이 없으므로 저장일로 대신한다.
// 관리자 미리보기처럼 초안이 화면에 오르는 경로가 있어 폴백이 필요하다.
export function getPostDate(post: {
  createdAt: string;
  publishedAt?: string | null;
}): string {
  return post.publishedAt ?? post.createdAt;
}
