import { parseDbTimestamp } from './dbTimestamp';
import { getPostDate } from './postDate';

type OrderablePost = {
  seriesOrder?: number | null;
  createdAt: string;
  publishedAt?: string | null;
};

// 공개 시리즈 페이지(lib/api/postOrder.ts)와 같은 규칙.
// 순번 오름차순, 순번 없는 글은 뒤로, 그 안에서는 게시일(초안은 저장일) 오름차순.
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
  return ids.filter(item => item !== id);
}

export function isSameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}
