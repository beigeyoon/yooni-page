import { revalidatePath } from 'next/cache';

export type ContentLocation = {
  category: string;
  slug?: string | null;
  seriesSlug?: string | null;
};

// 글 하나가 바뀌면 그 글을 나열하는 페이지도 같이 낡는다.
// 수정으로 시리즈를 옮긴 경우처럼 위치가 둘 이상일 수 있어 가변 인자로 받는다.
export function buildContentPaths(...locations: ContentLocation[]): string[] {
  const paths = new Set<string>(['/']);

  for (const { category, slug, seriesSlug } of locations) {
    if (!category) continue;

    paths.add(`/${category}`);
    if (slug) paths.add(`/${category}/${slug}`);
    if (seriesSlug) paths.add(`/${category}/series/${seriesSlug}`);
  }

  return [...paths];
}

export function revalidateContent(...locations: ContentLocation[]): void {
  for (const path of buildContentPaths(...locations)) {
    revalidatePath(path);
  }
}
