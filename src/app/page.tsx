export const dynamic = 'auto';

import { RecentPosts } from '@/components/RecentPosts';
import { getPostsForServer } from '@/lib/api/posts';
import { Category, Post } from '@/types';
import { Silkscreen } from 'next/font/google';
import { Newspaper, Grid2X2Check } from 'lucide-react';
import GithubCalendar from '@/components/GithubCalendar';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import Image from 'next/image';
import { Metadata } from 'next';

const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: '400',
  display: 'swap'
});

export const metadata: Metadata = {
  title: '유니의 블로그 | 프론트엔드 개발자 유니',
  description: '프론트엔드 개발자 유니의 기술 블로그입니다. Next.js, React, 웹 개발, 여행, 이야기를 담은 공간입니다.',
  keywords: '프론트엔드 개발자, Next.js, React, 웹 개발, 기술 블로그, 유니, yooni, 프론트엔드, 개발자 포트폴리오',
  authors: [{ name: '윤이' }],
  openGraph: {
    title: '유니의 블로그 | 프론트엔드 개발자 유니',
    description: '프론트엔드 개발자 유니의 기술 블로그입니다. Next.js, React, 웹 개발, 여행, 이야기를 담은 공간입니다.',
    type: 'website',
    url: 'https://yooni.seoul.kr',
    siteName: '유니의 블로그',
    locale: 'ko_KR',
    images: [
      {
        url: 'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png',
        width: 1200,
        height: 630,
        alt: '유니의 블로그'
      }
    ]
  },
  twitter: {
    title: '유니의 블로그 | 프론트엔드 개발자 유니',
    description: '프론트엔드 개발자 유니의 기술 블로그입니다. Next.js, React, 웹 개발, 여행, 이야기를 담은 공간입니다.',
    card: 'summary_large_image',
    images: [
      'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png'
    ]
  },
  alternates: {
    canonical: 'https://yooni.seoul.kr'
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

export default async function Home() {
  const categories: Category[] = ['dev', 'travel', 'talk'];
  const postsByCategory: Record<string, Post[]> = {};

  const queryClient = new QueryClient();

  await Promise.all(
    categories.map(category =>
      queryClient.prefetchQuery({
        queryKey: ['posts', category],
        queryFn: () => getPostsForServer(category)
      })
    )
  );

  const dehydratedState = dehydrate(queryClient);

  for (const category of categories) {
    const cached = queryClient.getQueryData(['posts', category]) as Awaited<
      ReturnType<typeof getPostsForServer>
    >;
    if (!cached) continue;
    const posts = cached.data as Post[];
    posts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    postsByCategory[category] = posts
      .filter(post => post.isPublished)
      .slice(0, 3);
  }

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="mx-auto max-w-[940px] pb-12">
        <section className="flex flex-col items-center px-12 pb-16 pt-8 text-center max-sm:px-0">
          <Image
            src="/images/main_yooni/main_yooni_3.png"
            alt="main-logo"
            height={180}
            width={180}
          />
          <h1
            className={`mb-6 mt-3 text-4xl font-bold max-sm:px-6 max-sm:text-3xl ${silkscreen.className}`}>
            Hello, there!
          </h1>
          <p className="max-sm:text-md text-lg max-sm:px-6">
            만나서 반가워요!
            <br />
            이곳은 개발의 치열함과 여행의 설렘, <br className="sm:hidden" />
            이야기의 즐거움을 담은 공간입니다.
            <br />
            <b>프론트엔드 개발자 유니</b>의 <br className="sm:hidden" /> 다양한
            기록을 둘러보세요.
          </p>
        </section>
        <section className="px-12 pb-12 max-sm:px-6">
          <h2 className="pb-4 text-2xl font-bold text-neutral-800">
            <Newspaper className="inline-block" /> 최신 글
          </h2>
          <div className="flex gap-8 rounded-lg bg-neutral-100/60 p-4 max-sm:flex-col">
            <RecentPosts
              category="dev"
              posts={postsByCategory['dev']}
            />
            <RecentPosts
              category="travel"
              posts={postsByCategory['travel']}
            />
            <RecentPosts
              category="talk"
              posts={postsByCategory['talk']}
            />
          </div>
        </section>
        <section className="px-12 max-sm:px-6">
          <h2 className="pb-4 text-2xl font-bold text-neutral-800">
            <Grid2X2Check className="inline-block" /> Commits
          </h2>
          <GithubCalendar />
        </section>
      </div>
    </HydrationBoundary>
  );
}
