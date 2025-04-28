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

const Talks = () => {
  const router = useRouter();

  const { data: posts } = useQuery({
    queryKey: ['posts', 'talks'],
    queryFn: () => getPosts('TALK'),
    select: data => {
      const postsData = (data?.data as { data: Post[] }).data;
      return getPostsList(postsData, 'TALK');
    }
  });

  const handlePostClick = (id: string) => {
    router.push(`/talks/${id}`);
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

const TalksWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Talks />
    </QueryClientProvider>
  );
};

export default TalksWrapper;
