import { RecentPosts } from '@/components/RecentPosts';
import { getPostsForServer } from '@/lib/api/posts';
import { Category, Post } from '@/types';

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
    <div className="flex gap-10 px-12">
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
  );
}
