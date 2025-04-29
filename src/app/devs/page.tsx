'use client';

import { PostPreview } from '@/components/PostPreview';
import { getPosts } from '@/lib/api/posts';
import { Post } from '@/types';
import getPostsList from '@/utils/getPostsList';
import {
  useQuery,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { FileWarning } from 'lucide-react';

const queryClient = new QueryClient();

const Devs = () => {
  const router = useRouter();

  const { data: posts } = useQuery({
    queryKey: ['posts', 'devs'],
    queryFn: () => getPosts('DEV'),
    select: data => {
      const postsData = (data?.data as { data: Post[] }).data;
      return getPostsList(postsData, 'DEV');
    }
  });

  const handlePostClick = (id: string) => {
    router.push(`/devs/${id}`);
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="flex w-full flex-col items-center gap-4 pt-10">
        <FileWarning width={48} />
        작성된 포스트가 없습니다.
      </div>
    );
  }
  return (
    <div className="flex flex-row-reverse justify-center gap-16 pb-10">
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

const DevsWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Devs />
    </QueryClientProvider>
  );
};

export default DevsWrapper;
