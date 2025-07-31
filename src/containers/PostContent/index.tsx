'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Post } from '@/types';
import { deletePost, getPost } from '@/lib/api/posts';
import { FileWarning, SquarePen } from 'lucide-react';
import handleTimeStirng from '@/utils/handleTimeStirng';
import { useAdjacentPosts } from '@/hooks/useAdjacentPosts';
import { Category } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import Comment from '@/components/Comment';
import { DeleteButton } from '@/components/DeleteButton';
import Link from 'next/link';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';

const PostContent = () => {
  const router = useRouteWithLoading();
  const { isAdmin, session, status } = useAuth();
  const params = useParams();
  const { id } = params as { id: string };

  const { data: post, isLoading } = useQuery({
    queryKey: ['posts', id],
    queryFn: () => getPost(id),
    select: (data: { data: Post }) => data.data
  });

  const { prevPost, nextPost } = useAdjacentPosts(
    id,
    post?.category as Category
  );

  useEffect(() => {
    if (!post || isAdmin || post.isPublished) return;
    router.push('/');
  }, [isAdmin, post, router]);

  const onClickEdit = () => {
    router.push(`/editor?id=${post?.id}`);
  };

  const onDeletePost = async () => {
    if (!isAdmin) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    const response = await deletePost(post!.id);
    if (response.message) {
      router.push(`/${post!.category}`);
    } else {
      console.error('❌ 포스트 삭제 실패:', response.error);
    }
  };

  if (!post) {
    if (isLoading) return <></>;
    return (
      <div className="flex w-full flex-col items-center gap-4 pt-10">
        <FileWarning width={48} />
        작성된 포스트가 없습니다.
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-[900px] flex-col py-8 max-sm:overflow-hidden max-sm:px-6">
      <div className="mb-10 flex items-center justify-between font-bold text-neutral-400">
        <Link href={`/${post.category}`}>#{post.category}</Link>
        {isAdmin && (
          <div>
            <Button
              variant="ghost"
              className="h-fit cursor-pointer px-2 py-1 text-neutral-500 hover:text-neutral-700"
              onClick={onClickEdit}>
              <SquarePen width={18} />
            </Button>
            <DeleteButton confirmDelete={onDeletePost} />
          </div>
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
        className="post-content prose max-w-none py-16 text-base leading-relaxed text-neutral-700"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <Comment
        postId={post.id}
        session={session}
        status={status}
      />

      <div className="flex justify-between py-12 text-sm text-neutral-400">
        {prevPost ? (
          <button
            onClick={() => router.push(`/${prevPost.category}/${prevPost.id}`)}
            className="hover:text-neutral-700">
            ← 이전 글: {prevPost.title}
          </button>
        ) : (
          <span />
        )}

        {nextPost ? (
          <button
            onClick={() => router.push(`/${nextPost.category}/${nextPost.id}`)}
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

export default PostContent;
