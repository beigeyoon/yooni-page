import PostContent from '@/containers/PostContent';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import { getPostForServer } from '@/lib/api/posts';
import PageReady from '@/components/Loading/PageReady';
import { metaDataKeywords } from '@/constants/metadataKeywords';

export async function generateMetadata({ params }: { params: { category: string; id: string } }) {
  const { id } = params;

  const postData = await getPostForServer(id);
  const post = postData?.data;

  if (!post) {
    return {
      title: '게시글을 찾을 수 없음',
      description: '존재하지 않는 게시글입니다.'
    };
  }

  return {
    title: post.title,
    description: post.subtitle || post.content.slice(0, 100),
    keywords: metaDataKeywords,
    openGraph: {
      title: post.title,
      description: post.subtitle || post.content.slice(0, 100),
      type: 'article',
      images: [
        'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png'
      ]
    },
    twitter: {
      title: post.title,
      description: post.subtitle || post.content.slice(0, 100),
      card: 'summary_large_image',
      images: [
        'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png'
      ]
    }
  };
}

const Post = async ({ params }: { params: { category: string; id: string } }) => {
  const { id } = params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['post', id],
    queryFn: () => getPostForServer(id)
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PageReady />
      <PostContent />
    </HydrationBoundary>
  );
};

export default Post;
