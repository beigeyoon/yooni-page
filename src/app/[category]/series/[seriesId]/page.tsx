import PostList from '@/containers/PostList';
import {
  getPostsBySeriesForServer,
  getSeriesForServer
} from '@/lib/api/posts.server';
import { Category, isValidCategory } from '@/types';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const SITE_URL = 'https://yooni.seoul.kr';
const OG_IMAGE =
  'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png';

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: Category; seriesId: string }>;
}): Promise<Metadata> {
  const { category, seriesId } = await params;
  const series = await getSeriesForServer(seriesId);

  if (!series) {
    return { title: '시리즈를 찾을 수 없음' };
  }

  const url = `${SITE_URL}/${category}/series/${seriesId}`;
  const title = `${series.title} | 유니의 블로그`;
  const description =
    series.description ?? `${series.title} 시리즈의 글 모음입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: '유니의 블로그',
      locale: 'ko_KR',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: series.title }]
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      images: [OG_IMAGE]
    },
    alternates: { canonical: url }
  };
}

const SeriesPosts = async ({
  params
}: {
  params: Promise<{ category: Category; seriesId: string }>;
}) => {
  const { category, seriesId } = await params;

  if (!isValidCategory(category)) {
    notFound();
  }

  const series = await getSeriesForServer(seriesId);
  if (!series) {
    notFound();
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['posts', seriesId],
    queryFn: () => getPostsBySeriesForServer(seriesId)
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostList category={category} seriesId={seriesId} />
    </HydrationBoundary>
  );
};

export default SeriesPosts;
