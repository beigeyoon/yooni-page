import PostListWrapper from '@/containers/PostList';
import { getPostsForServer } from '@/lib/api/posts';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

const Devs = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['posts', 'DEV'],
    queryFn: () => getPostsForServer('DEV'),
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostListWrapper category="DEV" />
    </HydrationBoundary>
  )
};

export default Devs;
