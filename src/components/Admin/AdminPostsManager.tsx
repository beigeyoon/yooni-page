'use client';

import PageReady from '@/components/Loading/PageReady';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getAllPostsForPreview } from '@/lib/api/posts';
import { Post } from '@/types';
import handleTimeStirng from '@/utils/handleTimeStirng';
import { useQuery } from '@tanstack/react-query';
import { Eye, FileWarning, Plus, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';

export default function AdminPostsManager() {
  const { isAdmin, status } = useAuth();
  const router = useRouteWithLoading();
  const canAccessAdmin = status === 'authenticated' && !!isAdmin;

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', 'preview', 'all'],
    queryFn: getAllPostsForPreview,
    enabled: canAccessAdmin,
    select: (data: { data: Post[] }) =>
      data.data
        .filter(post => !post.isPublished)
        .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!canAccessAdmin) {
      router.push('/');
    }
  }, [canAccessAdmin, router, status]);

  if (!canAccessAdmin) return <></>;

  return (
    <>
      <PageReady />
      <div className="flex items-center justify-between gap-4 pb-4 max-sm:flex-col max-sm:items-start">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">비공개 글 관리</h1>
          <p className="mt-2 text-sm text-neutral-500">
            비공개 글은 여기서만 확인하고 편집할 수 있습니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/editor">
            <Plus />
            새 글 작성
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex w-full flex-col items-center gap-4 py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-700"></div>
          <p className="text-sm text-neutral-500">글 목록을 불러오는 중입니다.</p>
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-dashed border-neutral-300 py-20 text-neutral-500">
          <FileWarning width={40} />
          <p>비공개 글이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => (
            <div
              key={post.id}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:border-neutral-300"
            >
              <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">
                      {post.category}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 ${
                        post.isPublished
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {post.isPublished ? '공개' : '비공개'}
                    </span>
                    <span className="text-neutral-400">
                      {handleTimeStirng(post.createdAt)}
                    </span>
                  </div>
                  <h2 className="truncate text-xl font-bold text-neutral-800">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                    {post.subtitle || '부제목 없음'}
                  </p>
                </div>
                <div className="flex gap-2 max-sm:w-full">
                  {post.isPublished && (
                    <Button
                      asChild
                      variant="outline"
                      className="max-sm:flex-1"
                    >
                      <Link href={`/${post.category}/${post.id}`}>
                        <Eye />
                        공개 보기
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    className="max-sm:flex-1"
                  >
                    <Link href={`/editor?id=${post.id}`}>
                      <SquarePen />
                      편집
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
