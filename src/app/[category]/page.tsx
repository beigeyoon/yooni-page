import PostList from '@/containers/PostList';
import { getPostsForServer } from '@/lib/api/posts';
import { Category } from '@/types';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import { Metadata } from 'next';

// 카테고리별 메타데이터 생성 함수
export async function generateMetadata({
  params
}: {
  params: Promise<{ category: Category }>;
}): Promise<Metadata> {
  const { category } = await params;

  const categoryInfo = {
    dev: {
      title: '개발 | 윤이의 블로그',
      description: '프론트엔드 개발, Next.js, React, 웹 개발 관련 기술 글들을 확인하세요.',
      keywords: '프론트엔드 개발, Next.js, React, 웹 개발, 기술 블로그, 개발자'
    },
    travel: {
      title: '여행 | 윤이의 블로그',
      description: '여행 이야기와 경험을 담은 글들을 확인하세요.',
      keywords: '여행, 여행 블로그, 여행기, 여행 후기, 여행 경험'
    },
    talk: {
      title: '이야기 | 윤이의 블로그',
      description: '일상의 이야기와 생각을 담은 글들을 확인하세요.',
      keywords: '이야기, 일상, 생각, 에세이, 블로그'
    },
    photo: {
      title: '사진 | 윤이의 블로그',
      description: '사진과 함께하는 이야기들을 확인하세요.',
      keywords: '사진, 포토, 이미지, 사진 블로그, 포토그래피'
    }
  };

  const info = categoryInfo[category];
  const siteUrl = 'https://yooni.seoul.kr';
  const categoryUrl = `${siteUrl}/${category}`;

  return {
    title: info.title,
    description: info.description,
    keywords: info.keywords,
    authors: [{ name: '윤이' }],
    category: category,
    openGraph: {
      title: info.title,
      description: info.description,
      type: 'website',
      url: categoryUrl,
      siteName: '윤이의 블로그',
      locale: 'ko_KR',
      images: [
        {
          url: 'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png',
          width: 1200,
          height: 630,
          alt: info.title
        }
      ]
    },
    twitter: {
      title: info.title,
      description: info.description,
      card: 'summary_large_image',
      images: [
        'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png'
      ]
    },
    alternates: {
      canonical: categoryUrl
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

const Posts = async ({
  params
}: {
  params: Promise<{ category: Category }>;
}) => {
  const { category } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['posts', category],
    queryFn: () => getPostsForServer(category)
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostList category={category} />
    </HydrationBoundary>
  );
};

export default Posts;
