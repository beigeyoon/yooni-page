import PostList from '@/containers/PostList';
import {
  getPostsBySeriesForServer,
  getSeriesBySlugForServer,
  getSeriesForServer
} from '@/lib/api/posts.server';
import { Category, isValidCategory } from '@/types';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import isUuid from '@/utils/isUuid';
import decodeSlugParam from '@/utils/decodeSlugParam';

const SITE_URL = 'https://yooni.seoul.kr';
const OG_IMAGE =
  'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png';

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: Category; seriesSlug: string }>;
}): Promise<Metadata> {
  const { category, seriesSlug: rawSeriesSlug } = await params;
  const seriesSlug = decodeSlugParam(rawSeriesSlug);

  // 레거시 UUID URL은 페이지 컴포넌트가 슬러그로 영구 이동시킨다.
  if (isUuid(seriesSlug)) {
    return { title: '유니의 블로그' };
  }

  const series = await getSeriesBySlugForServer(seriesSlug);

  if (!series) {
    return { title: '시리즈를 찾을 수 없음' };
  }

  const url = `${SITE_URL}/${category}/series/${series.slug}`;
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
  params: Promise<{ category: Category; seriesSlug: string }>;
}) => {
  const { category, seriesSlug: rawSeriesSlug } = await params;
  const seriesSlug = decodeSlugParam(rawSeriesSlug);

  if (!isValidCategory(category)) {
    notFound();
  }

  // 예전 UUID URL은 슬러그로 영구 이동시킨다.
  // permanentRedirect는 내부적으로 예외를 던지므로 try/catch로 감싸면 안 된다.
  if (isUuid(seriesSlug)) {
    const legacy = await getSeriesForServer(seriesSlug);
    if (legacy?.slug) {
      permanentRedirect(`/${category}/series/${legacy.slug}`);
    }
    notFound();
  }

  const series = await getSeriesBySlugForServer(seriesSlug);
  if (!series) {
    notFound();
  }

  // 조회는 여전히 id 기준이다. 슬러그는 URL에만 쓴다.
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['posts', series.id],
    queryFn: () => getPostsBySeriesForServer(series.id)
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostList category={category} seriesId={series.id} />
    </HydrationBoundary>
  );
};

export default SeriesPosts;
