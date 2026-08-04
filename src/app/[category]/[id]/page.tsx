import PostContent from '@/containers/PostContent';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import {
  getPostForServer,
  getPostsBySeriesForServer,
  getPostsForServer,
  getSeriesForServer
} from '@/lib/api/posts.server';
import PageReady from '@/components/Loading/PageReady';
import SeriesToc from '@/components/SeriesToc';
import SeriesNav from '@/components/SeriesNav';
import { metaDataKeywords } from '@/constants/metadataKeywords';
import { Metadata } from 'next';
import { isValidCategory, type Post } from '@/types';
import { notFound } from 'next/navigation';
import sanitizePostHtml from '@/utils/sanitizePostHtml';
import optimizePostHtml from '@/utils/optimizePostHtml';

// 포스트 내용에서 키워드 추출 함수
function extractKeywords(content: string, title: string, category: string): string[] {
  const baseKeywords = metaDataKeywords;
  const contentKeywords = content
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
    .slice(0, 10);
  
  const titleKeywords = title.split(/\s+/);
  const categoryKeywords = [category, '블로그', '개발', '여행', '사진', '이야기'];
  
  return [...new Set([...baseKeywords, ...contentKeywords, ...titleKeywords, ...categoryKeywords])];
}

// 포스트 내용에서 설명 생성 함수
function generateDescription(content: string, subtitle?: string): string {
  if (subtitle) {
    return subtitle;
  }
  
  // HTML 태그 제거
  const cleanContent = content.replace(/<[^>]*>/g, '');
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
  params: Promise<{ category: string; id: string }>;
}): Promise<Metadata> {
  const { category, id } = await params;

  if (!isValidCategory(category)) {
    return { title: '페이지를 찾을 수 없음' };
  }

  const postData = await getPostForServer(id);
  const post = postData?.data;

  if (!post || post.category !== category) {
    return {
      title: '게시글을 찾을 수 없음',
      description: '존재하지 않는 게시글입니다.'
    };
  }

  const keywords = extractKeywords(post.content, post.title, category);
  const description = generateDescription(post.content, post.subtitle);
  const siteUrl = 'https://yooni.seoul.kr';
  const postUrl = `${siteUrl}/${category}/${id}`;

  return {
    title: `${post.title} | 유니의 블로그`,
    description,
    keywords: keywords.join(', '),
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
          url: 'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png',
          width: 1200,
          height: 630,
          alt: post.title
        }
      ],
      publishedTime: post.createdAt,
      modifiedTime: post.createdAt,
      authors: ['유니']
    },
    twitter: {
      title: post.title,
      description,
      card: 'summary_large_image',
      images: [
        'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png'
      ]
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
function generateStructuredData(post: Post, category: string) {
  const siteUrl = 'https://yooni.seoul.kr';
  const postUrl = `${siteUrl}/${category}/${post.id}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.subtitle || post.content.slice(0, 200),
    author: {
      '@type': 'Person',
      name: '유니',
      url: siteUrl
    },
    publisher: {
      '@type': 'Organization',
      name: '유니의 블로그',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: 'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl
    },
    datePublished: post.createdAt,
    dateModified: post.createdAt,
    image: {
      '@type': 'ImageObject',
      url: 'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png'
    },
    articleSection: category,
    keywords: extractKeywords(post.content, post.title, category).join(', ')
  };
}

function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

const Post = async ({ params }: { params: Promise<{ category: string; id: string }> }) => {
  const { category, id } = await params;

  if (!isValidCategory(category)) {
    notFound();
  }

  const postData = await getPostForServer(id);
  const post = postData?.data as Post | null;

  if (!post || post.category !== category) {
    notFound();
  }

  const queryClient = new QueryClient();
  queryClient.setQueryData(['posts', id], { data: post });

  const dehydratedState = dehydrate(queryClient);
  const structuredData = generateStructuredData(post, category);

  // 시리즈 소속이면 목차 + 시리즈 내 이전/다음 편,
  // 아니면 카테고리 기준 이전/다음 글
  let toc: React.ReactNode = null;
  let nav: React.ReactNode = null;

  if (post.seriesId) {
    const [series, seriesPosts] = await Promise.all([
      getSeriesForServer(post.seriesId),
      getPostsBySeriesForServer(post.seriesId)
    ]);

    if (series) {
      const list = seriesPosts.data;
      const currentIndex = list.findIndex(p => p.id === post.id);

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
      <PostContent
        content={optimizePostHtml(sanitizePostHtml(post.content))}
        toc={toc}
        nav={nav}
      />
    </HydrationBoundary>
  );
};

export default Post;
