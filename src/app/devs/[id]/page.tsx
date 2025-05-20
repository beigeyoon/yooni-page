import PostContent from '@/containers/PostContent';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getPostForServer } from '@/lib/api/posts';

const Post = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['post', id],
    queryFn: () => getPostForServer(id),
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostContent />
    </HydrationBoundary>
  )
};

export default Post;