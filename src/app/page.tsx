export const dynamic = 'force-dynamic';

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

const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: '400',
  display: 'swap'
});

export default async function Home() {
  const categories: Category[] = ['dev', 'travel', 'talk'];
  const postsByCategory: Record<string, Post[]> = {};

  const queryClient = new QueryClient();

  for (const category of categories) {
    await queryClient.prefetchQuery({
      queryKey: ['posts', category],
      queryFn: () => getPostsForServer(category)
    });
  }

  const dehydratedState = dehydrate(queryClient);

  for (const category of categories) {
    const cached = queryClient.getQueryData(['posts', category]) as Awaited<
      ReturnType<typeof getPostsForServer>
    >;
    const posts = cached.data as Post[];
    posts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    postsByCategory[category] = posts.slice(0, 3);
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
