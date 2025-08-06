import PostContent from '@/containers/PostContent';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import { getPostForServer } from '@/lib/api/posts';
import PageReady from '@/components/Loading/PageReady';
import { metaDataKeywords } from '@/constants/metadataKeywords';
import { Metadata } from 'next';
import type { Post } from '@/types';

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

  const postData = await getPostForServer(id);
  const post = postData?.data;

  if (!post) {
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
    authors: [{ name: '윤이' }],
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
      authors: ['윤이']
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
      name: '윤이',
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

const Post = async ({ params }: { params: Promise<{ category: string; id: string }> }) => {
  const { category, id } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['post', id],
    queryFn: () => getPostForServer(id)
  });

  const dehydratedState = dehydrate(queryClient);

  // 구조화된 데이터 추가
  const postData = await getPostForServer(id);
  const post = postData?.data;
  
  const structuredData = post ? generateStructuredData(post, category) : null;

  return (
    <HydrationBoundary state={dehydratedState}>
      <PageReady />
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      <PostContent />
    </HydrationBoundary>
  );
};

export default Post;
