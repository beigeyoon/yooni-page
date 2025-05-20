import PostList from '@/containers/PostList';
import { getPostsForServer } from '@/lib/api/posts';
import { Category } from '@/types';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';

const Posts = async ({
  params
}: {
  params: Promise<{ category: Category }>;
}) => {
  const { category } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['posts', category],
    queryFn: () => getPostsForServer(category)
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostList category={category} />
    </HydrationBoundary>
  );
};

export default Posts;
