import { parseDbTimestamp } from './dbTimestamp';
import { getPostDate } from './postDate';

type OrderablePost = {
  seriesOrder?: number | null;
  createdAt: string;
  publishedAt?: string | null;
};

// 공개 시리즈 페이지(src/lib/api/postOrder.ts)와 같은 규칙: 순번 오름차순, 순번 없는 글은 뒤로, 그 안에서는 게시일 오름차순.
// 다만 초안은 공개 쿼리에 나오지 않으므로 여기서만 저장일로 끼워 넣는다.
export function sortSeriesPosts<T extends OrderablePost>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const ao = a.seriesOrder ?? null;
    const bo = b.seriesOrder ?? null;
    if (ao !== null && bo !== null && ao !== bo) return ao - bo;
    if (ao !== null && bo === null) return -1;
    if (ao === null && bo !== null) return 1;
    return (
      parseDbTimestamp(getPostDate(a)).getTime() -
      parseDbTimestamp(getPostDate(b)).getTime()
    );
  });
}

// 경계를 넘는 이동은 같은 배열을 그대로 돌려준다. 호출한 쪽은 참조 비교로 변화 여부를 알 수 있다.
export function moveItem(
  ids: string[],
  index: number,
  direction: 'up' | 'down'
): string[] {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= ids.length) return ids;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function appendItem(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

export function removeItem(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(item => item !== id) : ids;
}

export function isSameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

// 에디터에서 시리즈를 고르면 채워 넣을 순번. 순번 없는 글은 세지 않고,
// 편집 중인 글 자신은 빼야 이미 그 시리즈에 있던 글이 제 순번을 밀어내지 않는다.
export function nextSeriesOrder(
  posts: { id: string; seriesOrder?: number | null }[],
  excludeId?: string
): number {
  const orders = posts
    .filter(post => post.id !== excludeId)
    .map(post => post.seriesOrder)
    .filter((order): order is number => typeof order === 'number');
  return orders.length > 0 ? Math.max(...orders) + 1 : 1;
}
