import PostListWrapper from '@/containers/PostList';
import { getPostsForServer } from '@/lib/api/posts';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

const Talks = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['posts', 'TALK'],
    queryFn: () => getPostsForServer('TALK'),
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostListWrapper category="TALK" />
    </HydrationBoundary>
  )
};

export default Talks;
