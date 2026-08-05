import PostContent from '@/containers/PostContent';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import {
  getPostBySlugForServer,
  getPostForServer,
  getPostsBySeriesForServer,
  getPostsForServer,
  getSeriesForServer
} from '@/lib/api/posts.server';
import PageReady from '@/components/Loading/PageReady';
import SeriesToc from '@/components/SeriesToc';
import SeriesNav from '@/components/SeriesNav';
import { Metadata } from 'next';
import { isValidCategory, type Post } from '@/types';
import { notFound, permanentRedirect } from 'next/navigation';
import sanitizePostHtml from '@/utils/sanitizePostHtml';
import optimizePostHtml from '@/utils/optimizePostHtml';
import { toIsoString } from '@/utils/dbTimestamp';
import isUuid from '@/utils/isUuid';
import decodeSlugParam from '@/utils/decodeSlugParam';

const SITE_URL = 'https://yooni.seoul.kr';
const OG_IMAGE =
  'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png';

const CATEGORY_LABELS: Record<string, string> = {
  dev: '개발',
  travel: '여행',
  talk: '이야기',
  photo: '사진'
};

// 포스트 내용에서 설명 생성 함수
function generateDescription(content: string, subtitle?: string): string {
  if (subtitle) {
    return subtitle;
  }

  // HTML 태그 제거
  const cleanContent = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // 첫 200자 추출 (한글 기준)
  const description = cleanContent.slice(0, 200);
  
  // 문장 끝에서 자르기
  const lastPeriod = description.lastIndexOf('.');
  const lastExclamation = description.lastIndexOf('!');
  const lastQuestion = description.lastIndexOf('?');
  const lastNewline = description.lastIndexOf('\n');
  
  const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion, lastNewline);
  
  if (lastBreak > 100) {
    return description.slice(0, lastBreak + 1);
  }
  
  return description;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug: rawSlug } = await params;
  const slug = decodeSlugParam(rawSlug);

  if (!isValidCategory(category)) {
    return { title: '페이지를 찾을 수 없음' };
  }

  // 레거시 UUID URL은 페이지 컴포넌트가 슬러그로 영구 리다이렉트한다.
  // 여기서 메타데이터를 붙여봐야 리다이렉트로 버려지므로 최소한만 돌려준다.
  if (isUuid(slug)) {
    return { title: '유니의 블로그' };
  }

  const postData = await getPostBySlugForServer(slug);
  const post = postData?.data;

  if (!post || post.category !== category) {
    return {
      title: '게시글을 찾을 수 없음',
      description: '존재하지 않는 게시글입니다.'
    };
  }

  const description = generateDescription(post.content, post.subtitle);
  const postUrl = `${SITE_URL}/${category}/${post.slug}`;

  return {
    title: `${post.title} | 유니의 블로그`,
    description,
    // 루트 레이아웃의 손으로 작성한 keywords가 상속되지 않도록 명시적으로 비운다.
    keywords: null,
    authors: [{ name: '유니' }],
    category: category,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: postUrl,
      siteName: '유니의 블로그',
      locale: 'ko_KR',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: post.title
        }
      ],
      publishedTime: toIsoString(post.createdAt),
      modifiedTime: toIsoString(post.createdAt),
      authors: ['유니']
    },
    twitter: {
      title: post.title,
      description,
      card: 'summary_large_image',
      images: [OG_IMAGE]
    },
    alternates: {
      canonical: postUrl
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'noarchive': false,
      },
    },
  };
}

// 구조화된 데이터 생성 함수
function generateStructuredData(
  post: Post,
  category: string,
  series: { slug: string; title: string } | null,
  position: number | null
) {
  const postUrl = `${SITE_URL}/${category}/${post.slug}`;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.subtitle || generateDescription(post.content),
    author: { '@type': 'Person', name: '유니', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: '유니의 블로그',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: OG_IMAGE }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    datePublished: toIsoString(post.createdAt),
    dateModified: toIsoString(post.createdAt),
    image: { '@type': 'ImageObject', url: OG_IMAGE },
    articleSection: category
  };

  if (series) {
    data.isPartOf = {
      '@type': 'CreativeWorkSeries',
      name: series.title,
      url: `${SITE_URL}/${category}/series/${series.slug}`
    };
    if (position !== null) {
      data.position = position;
    }
  }

  return data;
}

function generateBreadcrumb(
  post: Post,
  category: string,
  series: { slug: string; title: string } | null
) {
  const items: { name: string; url: string }[] = [
    { name: '홈', url: SITE_URL },
    { name: CATEGORY_LABELS[category] ?? category, url: `${SITE_URL}/${category}` }
  ];

  if (series) {
    items.push({
      name: series.title,
      url: `${SITE_URL}/${category}/series/${series.slug}`
    });
  }

  items.push({ name: post.title, url: `${SITE_URL}/${category}/${post.slug}` });

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

const Post = async ({
  params
}: {
  params: Promise<{ category: string; slug: string }>;
}) => {
  const { category, slug: rawSlug } = await params;
  const slug = decodeSlugParam(rawSlug);

  if (!isValidCategory(category)) {
    notFound();
  }

  // 예전 UUID URL로 들어온 요청은 검색 색인을 잃지 않도록 슬러그로 영구 이동시킨다.
  // permanentRedirect는 내부적으로 예외를 던지므로 try/catch로 감싸면 안 된다.
  if (isUuid(slug)) {
    const legacy = await getPostForServer(slug);
    if (legacy?.data?.slug) {
      permanentRedirect(`/${category}/${legacy.data.slug}`);
    }
    notFound();
  }

  const postData = await getPostBySlugForServer(slug);
  const post = postData?.data as Post | null;

  if (!post || post.category !== category) {
    notFound();
  }

  const queryClient = new QueryClient();
  queryClient.setQueryData(['posts', slug], { data: post });

  const dehydratedState = dehydrate(queryClient);

  // 시리즈 소속이면 목차 + 시리즈 내 이전/다음 편,
  // 아니면 카테고리 기준 이전/다음 글
  let toc: React.ReactNode = null;
  let nav: React.ReactNode = null;
  let seriesInfo: { slug: string; title: string } | null = null;
  let position: number | null = null;

  if (post.seriesId) {
    const [series, seriesPosts] = await Promise.all([
      getSeriesForServer(post.seriesId),
      getPostsBySeriesForServer(post.seriesId)
    ]);

    if (series) {
      const list = seriesPosts.data;
      const currentIndex = list.findIndex(p => p.id === post.id);

      seriesInfo = { slug: series.slug, title: series.title };
      position = currentIndex >= 0 ? currentIndex + 1 : null;

      toc = (
        <SeriesToc
          series={series}
          posts={list}
          currentPostId={post.id}
        />
      );
      nav = (
        <SeriesNav
          prevPost={currentIndex > 0 ? list[currentIndex - 1] : null}
          nextPost={
            currentIndex >= 0 && currentIndex < list.length - 1
              ? list[currentIndex + 1]
              : null
          }
          prevLabel="이전 편"
          nextLabel="다음 편"
        />
      );
    }
  }

  const structuredData = generateStructuredData(
    post,
    category,
    seriesInfo,
    position
  );
  const breadcrumbData = generateBreadcrumb(post, category, seriesInfo);

  if (!nav) {
    // 카테고리 목록은 최신순이므로, 배열에서 뒤가 더 오래된 글이다
    const categoryPosts = await getPostsForServer(category);
    const list = categoryPosts.data;
    const currentIndex = list.findIndex(p => p.id === post.id);

    nav = (
      <SeriesNav
        prevPost={
          currentIndex >= 0 && currentIndex < list.length - 1
            ? list[currentIndex + 1]
            : null
        }
        nextPost={currentIndex > 0 ? list[currentIndex - 1] : null}
      />
    );
  }

  return (
    <HydrationBoundary state={dehydratedState}>
      <PageReady />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(structuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbData)
        }}
      />
      <PostContent
        content={optimizePostHtml(sanitizePostHtml(post.content))}
        toc={toc}
        nav={nav}
      />
    </HydrationBoundary>
  );
};

export default Post;
