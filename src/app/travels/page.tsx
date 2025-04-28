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

const queryClient = new QueryClient();

const Travels = () => {
  const router = useRouter();

  const { data: posts } = useQuery({
    queryKey: ['posts', 'travels'],
    queryFn: () => getPosts('TRAVEL'),
    select: data => {
      const postsData = (data?.data as { data: Post[] }).data;
      return getPostsList(postsData, 'TRAVEL');
    }
  });

  const handlePostClick = (id: string) => {
    router.push(`/travels/${id}`);
  };

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

const TravelsWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Travels />
    </QueryClientProvider>
  );
};

export default TravelsWrapper;
