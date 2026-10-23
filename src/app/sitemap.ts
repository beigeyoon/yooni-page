import type { MetadataRoute } from 'next';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { PUBLIC_CATEGORIES, type Post } from '@/types';
import { parseDbTimestamp } from '@/utils/dbTimestamp';
import { getPostDate } from '@/utils/postDate';
import { orderByNewest } from '@/lib/api/postOrder';

export const revalidate = 3600;

const SITE_URL = 'https://yooni.seoul.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabasePublic = getSupabasePublic();

  const [postsResult, seriesResult] = await Promise.all([
    orderByNewest(
      supabasePublic
        .from('post')
        .select('slug, category, createdAt, publishedAt, seriesId')
        .eq('isPublished', true)
        .in('category', [...PUBLIC_CATEGORIES])
    ),
    supabasePublic
      .from('series')
      .select('id, slug, category, createdAt')
      .in('category', [...PUBLIC_CATEGORIES])
  ]);

  // select 목록에서 컬럼이 빠지면 getPostDate가 조용히 createdAt으로 폴백하므로 타입으로 묶어둔다.
  const posts = (postsResult.data ?? []) as Pick<
    Post,
    'slug' | 'category' | 'createdAt' | 'publishedAt' | 'seriesId'
  >[];

  // 정적 페이지의 lastModified는 그 페이지에 실리는 가장 최근 글의 게시일로 본다.
  // 매번 "지금"을 넣으면 구글이 이 사이트의 lastmod를 믿지 않게 되고,
  // 그러면 개별 글의 수정일 신호까지 무시된다.
  // 글 목록이 최신순이므로 처음 만나는 글이 가장 최근 글이다.
  const latestPostDateByCategory = new Map<string, Date>();
  for (const post of posts) {
    if (!latestPostDateByCategory.has(post.category)) {
      latestPostDateByCategory.set(
        post.category,
        parseDbTimestamp(getPostDate(post))
      );
    }
  }
  const latestPostDate = posts[0]
    ? parseDbTimestamp(getPostDate(posts[0]))
    : undefined;

  // about·project는 근거가 되는 날짜가 없어 lastModified를 넣지 않는다.
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: latestPostDate,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${SITE_URL}/project`,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    ...PUBLIC_CATEGORIES.map(category => ({
      url: `${SITE_URL}/${category}`,
      lastModified: latestPostDateByCategory.get(category),
      changeFrequency: 'daily' as const,
      priority: 0.9
    }))
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${SITE_URL}/${post.category}/${post.slug}`,
    lastModified: parseDbTimestamp(getPostDate(post)),
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  // 시리즈의 최종 수정일은 소속 글 중 가장 최근 발행일로 본다.
  // 글이 추가되면 시리즈 페이지도 갱신된 것으로 취급해야 재크롤을 유도할 수 있다.
  const latestPostDateBySeries = new Map<string, Date>();
  for (const post of posts) {
    if (!post.seriesId) continue;
    const date = parseDbTimestamp(getPostDate(post));
    const current = latestPostDateBySeries.get(post.seriesId);
    if (!current || date > current) {
      latestPostDateBySeries.set(post.seriesId, date);
    }
  }

  const seriesEntries: MetadataRoute.Sitemap =
    seriesResult.data?.map(series => ({
      url: `${SITE_URL}/${series.category}/series/${series.slug}`,
      lastModified:
        latestPostDateBySeries.get(series.id) ??
        (series.createdAt ? parseDbTimestamp(series.createdAt) : undefined),
      changeFrequency: 'weekly',
      // 시리즈를 토픽 허브로 밀기 위해 개별 글보다 높게 둔다
      priority: 0.9
    })) ?? [];

  return [...staticEntries, ...postEntries, ...seriesEntries];
}
