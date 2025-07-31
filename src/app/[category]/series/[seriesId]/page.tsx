import PostList from '@/containers/PostList';
import { getPostsBySeriesForServer } from '@/lib/api/posts';
import { Category } from '@/types';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';

const SeriesPosts = async ({
  params
}: {
  params: Promise<{ category: Category; seriesId: string }>;
}) => {
  const { category, seriesId } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['posts', seriesId],
    queryFn: () => getPostsBySeriesForServer(seriesId)
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostList category={category} seriesId={seriesId} />
    </HydrationBoundary>
  );
};

export default SeriesPosts; 