import { RecentPosts } from '@/components/RecentPosts';
import { getPostsForServer } from '@/lib/api/posts';
import { Category, Post } from '@/types';
import Image from 'next/image';
import { Silkscreen } from 'next/font/google';
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
    <>
      <section className="flex flex-col items-center pb-24 pt-10 text-center">
        <Image
          src="/images/yooni_px.png"
          alt="profile"
          width={180}
          height={180}
        />
        <h1 className={`mb-8 text-5xl font-bold ${silkscreen.className}`}>
          Hello, there!
        </h1>
        <p className="text-lg">
          반가워요!
          <br />
          이곳은 개발의 치열함과 여행의 설렘, 랜덤한 생각을 담은 공간입니다.
          <br />
          <b>프론트엔드 개발자 유니</b>의 다양한 기록을 둘러보세요.
        </p>
      </section>
      <section className="px-12">
        <h2 className="pb-4 text-2xl font-bold text-neutral-800">📝 최신 글</h2>
        <div className="flex gap-8 rounded-lg bg-neutral-100/60 p-4">
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
    </>
  );
}
