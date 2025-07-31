import { useQuery } from '@tanstack/react-query';
import { getPosts } from '@/lib/api/posts';
import { Category, Post } from '@/types';

export function useAdjacentPosts(postId: string, category: Category) {
  const { data: posts } = useQuery({
    queryKey: ['posts', category],
    enabled: !!category,
    queryFn: () => getPosts(category),
    select: (data: { data: Post[] }) => {
      const postsData = data.data;
      return postsData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  });

  if (!posts) {
    return { prevPost: null, nextPost: null };
  }

  const currentIndex = posts.findIndex(p => p.id === postId);
  const prevPost = posts[currentIndex + 1] ?? null;
  const nextPost = posts[currentIndex - 1] ?? null;

  return { prevPost, nextPost };
}