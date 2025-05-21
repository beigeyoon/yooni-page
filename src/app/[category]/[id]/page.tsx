import PostContent from '@/containers/PostContent';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import { getPostForServer } from '@/lib/api/posts';
import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

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
    keywords: [
      '프론트엔드',
      '프론트엔드 개발자',
      'Next.js',
      '웹 개발',
      '기술 블로그',
      '개발 블로그',
      '포트폴리오',
      '유니',
      'yooni',
      '프론트엔드 포트폴리오',
      '여행 블로그',
      '여행',
      '생각',
      '글쓰기',
      '이야기',
      '커리어',
      '유니 블로그',
      '개발자 블로그',
      '포트폴리오 블로그'
    ],
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

const Post = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['post', id],
    queryFn: () => getPostForServer(id)
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostContent />
    </HydrationBoundary>
  );
};

export default Post;
