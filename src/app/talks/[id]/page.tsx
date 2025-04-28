'use client';

import {
  useQuery,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Post } from '@/types';
import { getPost } from '@/lib/api/posts';
const queryClient = new QueryClient();

const TalkPostDetail = () => {
  const params = useParams();
  const { id } = params as { id: string };

  const { data: post } = useQuery({
    queryKey: ['posts', 'talks', id],
    queryFn: () => getPost(id) as Promise<{ data: { data: Post } }>,
    select: (data: { data: { data: Post } }) => data.data.data as Post
  });

  if (!post) return <div>포스트를 찾을 수 없습니다.</div>;
  return (
    <div>
      <h1 className="text-2xl font-bold">{post.title}</h1>
      <p className="mt-4">{post.content}</p>
    </div>
  );
};

const TalkPostDetailWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TalkPostDetail />
    </QueryClientProvider>
  );
};

export default TalkPostDetailWrapper;
