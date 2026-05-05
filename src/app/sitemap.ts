import type { MetadataRoute } from 'next';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { CATEGORIES } from '@/types';

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
      .select('id, category, createdAt')
      .eq('isPublished', true)
      .order('createdAt', { ascending: false }),
    supabasePublic.from('series').select('id, category, createdAt')
  ]);

  const postEntries: MetadataRoute.Sitemap =
    postsResult.data?.map(post => ({
      url: `${SITE_URL}/${post.category}/${post.id}`,
      lastModified: new Date(post.createdAt),
      changeFrequency: 'monthly',
      priority: 0.7
    })) ?? [];

  const seriesEntries: MetadataRoute.Sitemap =
    seriesResult.data?.map(series => ({
      url: `${SITE_URL}/${series.category}/series/${series.id}`,
      lastModified: series.createdAt ? new Date(series.createdAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6
    })) ?? [];

  return [...staticEntries, ...postEntries, ...seriesEntries];
}
