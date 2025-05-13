import { RecentPosts } from '@/components/RecentPosts';
import { getPostsForServer } from '@/lib/api/posts';
import { Category, Post } from '@/types';
import { Silkscreen } from 'next/font/google';
import { Newspaper, Grid2X2Check } from 'lucide-react';
import GithubCalendar from '@/components/GithubCalendar';
import ImageSlide from '@/components/ImageSlide';
import { mainYooniImages } from '@/constants/imageMarquee';
import Thought from '@/components/Thought';
const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: '400',
  display: 'swap'
});

export default async function Home() {
  const categories: Category[] = ['DEV', 'TRAVEL', 'TALK'];
  const postsByCategory: Record<string, Post[]> = {};

  for (const category of categories) {
    const res = await getPostsForServer(category);
    const posts = res.data as Post[];
    posts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    postsByCategory[category] = posts?.slice(0, 3);
  }

  return (
    <div className="mx-auto max-w-[1100px] pb-12">
      <Thought />
      <section className="flex flex-col items-center px-12 pb-24 pt-8 text-center max-sm:px-0">
        <ImageSlide images={mainYooniImages} />
        <h1
          className={`mb-8 mt-12 text-5xl font-bold max-sm:px-6 max-sm:text-3xl ${silkscreen.className}`}>
          Hello, there!
        </h1>
        <p className="text-lg max-sm:px-6">
          반가워요!
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
            category="devs"
            posts={postsByCategory['DEV']}
          />
          <RecentPosts
            category="travels"
            posts={postsByCategory['TRAVEL']}
          />
          <RecentPosts
            category="talks"
            posts={postsByCategory['TALK']}
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
  );
}
