import type { MetadataRoute } from 'next';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { CATEGORIES } from '@/types';
import { parseDbTimestamp } from '@/utils/dbTimestamp';

export const revalidate = 3600;

const SITE_URL = 'https://yooni.seoul.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${SITE_URL}/project`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    ...CATEGORIES.map(category => ({
      url: `${SITE_URL}/${category}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9
    }))
  ];

  const supabasePublic = getSupabasePublic();

  const [postsResult, seriesResult] = await Promise.all([
    supabasePublic
      .from('post')
      .select('slug, category, createdAt, seriesId')
      .eq('isPublished', true)
      .order('createdAt', { ascending: false }),
    supabasePublic.from('series').select('id, slug, category, createdAt')
  ]);

  const posts = postsResult.data ?? [];

  const postEntries: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${SITE_URL}/${post.category}/${post.slug}`,
    lastModified: parseDbTimestamp(post.createdAt),
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  // 시리즈의 최종 수정일은 소속 글 중 가장 최근 발행일로 본다.
  // 글이 추가되면 시리즈 페이지도 갱신된 것으로 취급해야 재크롤을 유도할 수 있다.
  const latestPostDateBySeries = new Map<string, Date>();
  for (const post of posts) {
    if (!post.seriesId) continue;
    const date = parseDbTimestamp(post.createdAt);
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
        (series.createdAt ? parseDbTimestamp(series.createdAt) : now),
      changeFrequency: 'weekly',
      // 시리즈를 토픽 허브로 밀기 위해 개별 글보다 높게 둔다
      priority: 0.9
    })) ?? [];

  return [...staticEntries, ...postEntries, ...seriesEntries];
}
