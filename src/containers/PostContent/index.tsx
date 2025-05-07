'use client';

import {
  useQuery,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Post } from '@/types';
import { getPost } from '@/lib/api/posts';
import { Loading } from '@/components/Loading';
import { FileWarning } from 'lucide-react';
import handleTimeStirng from '@/utils/handleTimeStirng';
import { useRouter } from 'next/navigation';
import { useAdjacentPosts } from '@/hooks/useAdjacentPosts';
import { getCategoryPathname } from '@/utils/getCategoryPathname';
import { Category } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
const queryClient = new QueryClient();

const PostContent = () => {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const params = useParams();
  const { id } = params as { id: string };

  const { data: post, isLoading } = useQuery({
    queryKey: ['posts', id],
    queryFn: () => getPost(id) as Promise<{ data: { data: Post } }>,
    select: (data: { data: { data: Post } }) => data.data.data as Post
  });

  const { prevPost, nextPost } = useAdjacentPosts(
    id,
    post?.category as Category
  );

  useEffect(() => {
    if (post && !isAdmin) router.push('/');
  }, [isAdmin, post, router]);

  const onClickEdit = () => {
    router.push(`/editor?id=${post?.id}`);
  };

  if (isLoading) {
    return <Loading />;
  }
  if (!post) {
    return (
      <div className="flex w-full flex-col items-center gap-4 pt-10">
        <FileWarning width={48} />
        작성된 포스트가 없습니다.
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-[900px] flex-col py-8">
      <div className="mb-10 flex items-center justify-between font-bold text-neutral-400">
        <span>#{post.category}</span>
        {isAdmin && (
          <Button
            variant="link"
            className="text-neutral-400"
            onClick={onClickEdit}>
            Edit
          </Button>
        )}
      </div>

      <div className="border-b border-neutral-400 pb-10">
        <div className="mb-2 text-4xl font-extrabold text-neutral-700">
          {post.title}
        </div>
        <div className="mb-10 text-xl text-neutral-500">{post.subtitle}</div>
        <div className="flex items-center gap-3">
          <Image
            src="/images/yooni_icon.webp"
            alt="yooni"
            className="rounded-full"
            width={36}
            height={36}
          />
          <span className="font-bold">Yooni</span>
          <span className="text-neutral-700">
            {handleTimeStirng(post.createdAt)}
          </span>
        </div>
      </div>

      <div
        className="prose max-w-none py-16 text-base leading-relaxed text-neutral-700"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="flex justify-between py-12 text-sm text-neutral-400">
        {prevPost ? (
          <button
            onClick={() =>
              router.push(
                `/${getCategoryPathname(prevPost.category)}/${prevPost.id}`
              )
            }
            className="hover:text-neutral-700">
            ← 이전 글: {prevPost.title}
          </button>
        ) : (
          <span />
        )}

        {nextPost ? (
          <button
            onClick={() =>
              router.push(
                `/${getCategoryPathname(nextPost.category)}/${nextPost.id}`
              )
            }
            className="hover:text-neutral-700">
            다음 글: {nextPost.title} →
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};

const PostContentWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <PostContent />
    </QueryClientProvider>
  );
};

export default PostContentWrapper;
