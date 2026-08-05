'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Post, Series } from '@/types';
import { deletePost, getPostBySlug } from '@/lib/api/posts';
import { getSeries } from '@/lib/api/series';
import { FileWarning, SquarePen } from 'lucide-react';
import handleTimeStirng from '@/utils/handleTimeStirng';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, type ReactNode } from 'react';
import Comment from '@/components/Comment';
import { DeleteButton } from '@/components/DeleteButton';
import Link from 'next/link';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';
import decodeSlugParam from '@/utils/decodeSlugParam';

// content는 서버에서 정화·최적화를 마친 HTML이 내려온다.
// 정화기를 여기(클라이언트 컴포넌트)에 두면 그 의존성이 SSR 번들에 딸려 들어간다.

const PostContent = ({
  content,
  toc,
  nav
}: {
  content: string;
  toc?: ReactNode;
  nav?: ReactNode;
}) => {
  const router = useRouteWithLoading();
  const { isAdmin, session, status } = useAuth();
  const params = useParams();
  // useParams는 인코딩된 세그먼트를 줄 수 있다.
  // 서버가 심어둔 캐시 키(['posts', 디코딩된 슬러그])와 어긋나면
  // 하이드레이션 직후 불필요한 재조회가 일어나고, 그 조회마저 실패한다.
  const { slug } = params as { slug: string };
  const decodedSlug = decodeSlugParam(slug);

  const { data: post, isLoading } = useQuery({
    queryKey: ['posts', decodedSlug],
    queryFn: () => getPostBySlug(decodedSlug),
    select: (data: { data: Post }) => data.data
  });

  const { data: seriesData } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries,
    select: (data: { data: Series[] }) => data.data,
    enabled: !!post?.seriesId
  });

  // 현재 포스트의 시리즈 정보 찾기
  const currentSeries = seriesData?.find(series => series.id === post?.seriesId);

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

    try {
      const response = await deletePost(post!.id);
      if (response.message) {
        router.push(`/${post!.category}`);
      }
    } catch (error) {
      console.error('❌ 포스트 삭제 실패:', error);
      alert(error instanceof Error ? error.message : '포스트 삭제에 실패했습니다.');
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
    <div className="mx-auto flex max-w-[780px] flex-col py-8 max-sm:overflow-hidden max-sm:px-4">
      <div className="mb-10 flex items-center justify-between font-bold text-neutral-400">
        <div>
          <Link href={`/${post.category}`} className='mr-2 hover:underline'>#{post.category}</Link>
          {currentSeries && (
            <Link href={`/${post.category}/series/${currentSeries.slug}`} className='hover:underline'>
              #{currentSeries.title}
            </Link>
          )}
        </div>
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
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {toc && <div className="mb-12">{toc}</div>}

      <Comment
        postId={post.id}
        session={session}
        status={status}
      />

      {nav}
    </div>
  );
};

export default PostContent;
