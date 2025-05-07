'use client';

import { PostPreview } from '@/components/PostPreview';
import { getPosts } from '@/lib/api/posts';
import { Category, Post } from '@/types';
import getPostsList from '@/utils/getPostsList';
import {
  useQuery,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { FileWarning } from 'lucide-react';
import { Loading } from '@/components/Loading';
import { getCategoryPathname } from '@/utils/getCategoryPathname';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

const queryClient = new QueryClient();

const PostList = ({ category }: { category: Category }) => {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', category],
    queryFn: () => getPosts(category),
    select: data => {
      const postsData = (data?.data as { data: Post[] }).data;
      return getPostsList(postsData, category);
    }
  });

  const handlePostClick = (id: string) => {
    router.push(`/${getCategoryPathname(category)}/${id}`);
  };

  const posts = useMemo(
    () => (isAdmin ? postsData : postsData?.filter(post => post.isPublished)),
    [postsData, isAdmin]
  );

  if (isLoading) {
    return <Loading />;
  }
  if (!posts || posts.length === 0) {
    return (
      <div className="flex w-full flex-col items-center gap-4 pt-10">
        <FileWarning width={48} />
        작성된 포스트가 없습니다.
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-[900px] flex-col-reverse justify-center pt-8">
      {posts?.map(post => (
        <PostPreview
          key={post.id}
          post={post}
          onClick={() => handlePostClick(post.id)}
        />
      ))}
    </div>
  );
};

const PostListWrapper = ({ category }: { category: Category }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <PostList category={category} />
    </QueryClientProvider>
  );
};

export default PostListWrapper;
