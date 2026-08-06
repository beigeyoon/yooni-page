import PostList from '@/containers/PostList';
import {
  getPostsBySeriesForServer,
  getSeriesBySlugForServer,
  getSeriesForServer
} from '@/lib/api/posts.server';
import { Category, isValidCategory, type Post } from '@/types';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import isUuid from '@/utils/isUuid';
import decodeSlugParam from '@/utils/decodeSlugParam';

// 즉시 무효화(revalidateContent)가 평소 갱신을 담당하고,
// 이 주기는 무효화가 실패했을 때를 위한 백스톱이다.
export const revalidate = 3600;

const SITE_URL = 'https://yooni.seoul.kr';
const OG_IMAGE =
  'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png';

const CATEGORY_LABELS: Record<string, string> = {
  dev: '개발',
  travel: '여행',
  talk: '이야기',
  photo: '사진'
};

function generateSeriesJsonLd(
  series: { slug: string; title: string; description?: string },
  category: string,
  posts: Post[]
) {
  const seriesUrl = `${SITE_URL}/${category}/series/${series.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: series.title,
    description: series.description ?? `${series.title} 시리즈의 글 모음입니다.`,
    url: seriesUrl,
    inLanguage: 'ko-KR',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: post.title,
        url: `${SITE_URL}/${category}/${post.slug}`
      }))
    }
  };
}

function generateSeriesBreadcrumb(
  series: { slug: string; title: string },
  category: string
) {
  const items: { name: string; url: string }[] = [
    { name: '홈', url: SITE_URL },
    { name: CATEGORY_LABELS[category] ?? category, url: `${SITE_URL}/${category}` },
    { name: series.title, url: `${SITE_URL}/${category}/series/${series.slug}` }
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

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
    // 지정하지 않으면 layout.tsx의 사이트 전역 keywords를 상속한다.
    // 그러면 여행 시리즈 페이지가 "프론트엔드 개발자, Next.js" 같은 키워드를 달게 된다.
    // null이 상속을 끊는 방법이다(생략이나 undefined로는 끊기지 않는다).
    keywords: null,
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
  // 슬러그에 한글이 들어가므로 인코딩하지 않으면 Location 헤더에 실을 수 없다.
  if (isUuid(seriesSlug)) {
    const legacy = await getSeriesForServer(seriesSlug);
    if (legacy?.slug) {
      permanentRedirect(
        `/${category}/series/${encodeURIComponent(legacy.slug)}`
      );
    }
    notFound();
  }

  const series = await getSeriesBySlugForServer(seriesSlug);
  if (!series) {
    notFound();
  }

  // 조회는 여전히 id 기준이다. 슬러그는 URL에만 쓴다.
  const seriesPosts = await getPostsBySeriesForServer(series.id);

  const queryClient = new QueryClient();
  queryClient.setQueryData(['posts', series.id], seriesPosts);

  const dehydratedState = dehydrate(queryClient);
  const seriesJsonLd = generateSeriesJsonLd(series, category, seriesPosts.data);
  const breadcrumbJsonLd = generateSeriesBreadcrumb(series, category);

  return (
    <HydrationBoundary state={dehydratedState}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(seriesJsonLd)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd)
        }}
      />
      <div className="mx-auto max-w-[780px] pt-8 max-sm:px-4">
        <div className="mb-8 rounded-lg bg-gradient-to-r from-neutral-50 to-neutral-100 p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-neutral-400"></div>
            <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Series
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-neutral-800">
            {series.title}
          </h1>
          {series.description && (
            <p className="leading-relaxed text-neutral-600">
              {series.description}
            </p>
          )}
        </div>
      </div>
      <PostList category={category} seriesId={series.id} />
    </HydrationBoundary>
  );
};

export default SeriesPosts;
