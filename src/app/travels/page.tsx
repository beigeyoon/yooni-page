'use client';

import { getPosts } from '@/lib/api/posts';
import { Post } from '@/types';
import {
  useQuery,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';

const queryClient = new QueryClient();

const Travels = () => {
  const { data: posts } = useQuery({
    queryKey: ['posts', 'travel'],
    queryFn: () => getPosts('TRAVEL'),
    select: data => (data?.data as { data: Post[] }).data
  });

  console.log(posts);
  return (
    <QueryClientProvider client={queryClient}>
      <h1>Travels</h1>
    </QueryClientProvider>
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
