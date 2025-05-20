import PostListWrapper from '@/containers/PostList';
import { getPostsForServer } from '@/lib/api/posts';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

const Travels = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['posts', 'TRAVEL'],
    queryFn: () => getPostsForServer('TRAVEL'),
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostListWrapper category="TRAVEL" />
    </HydrationBoundary>
  )
};

export default Travels;
