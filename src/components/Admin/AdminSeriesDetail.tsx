'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/AppLink';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  LoaderCircle,
  SquarePen,
  X
} from 'lucide-react';
import PageReady from '@/components/Loading/PageReady';
import SeriesModal from '@/components/SeriesModal';
import SeriesPostPicker from '@/components/Admin/SeriesPostPicker';
import { Button } from '@/components/ui/button';
import { useAdminGate } from '@/hooks/useAdminGate';
import { getAllPostsForPreview } from '@/lib/api/posts';
import { getSeries, updateSeriesPosts } from '@/lib/api/series';
import { Post, Series } from '@/types';
import { parseDbTimestamp } from '@/utils/dbTimestamp';
import handleTimeStirng from '@/utils/handleTimeStirng';
import { getPostDate } from '@/utils/postDate';
import { findSeriesByIdOrSlug } from '@/utils/findSeries';
import {
  appendItem,
  isSameOrder,
  moveItem,
  removeItem,
  sortSeriesPosts
} from '@/utils/seriesEditor';

// URL 세그먼트는 UUID일 수도, 공개 페이지와 같은 슬러그일 수도 있다.
export default function AdminSeriesDetail({ idOrSlug }: { idOrSlug: string }) {
  const { canAccessAdmin } = useAdminGate();
  const queryClient = useQueryClient();

  const {
    data: seriesList,
    isLoading: seriesLoading,
    isError: seriesError,
    refetch: refetchSeries
  } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries,
    enabled: canAccessAdmin,
    select: (data: { data: Series[] }) => data.data
  });

  const {
    data: posts,
    isLoading: postsLoading,
    isError: postsError,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['posts', 'preview', 'all'],
    queryFn: getAllPostsForPreview,
    enabled: canAccessAdmin,
    select: (data: { data: Post[] }) => data.data
  });

  const series = findSeriesByIdOrSlug(seriesList ?? [], idOrSlug);
  // 아래 계산은 전부 실제 id 기준이다. 아직 못 찾았으면 null이라 소속 글도 비어 있다.
  const seriesId = series?.id ?? null;

  const postById = useMemo(
    () => new Map((posts ?? []).map(post => [post.id, post])),
    [posts]
  );
  const seriesById = useMemo(
    () => new Map((seriesList ?? []).map(item => [item.id, item])),
    [seriesList]
  );

  // 기준선 = 서버에 저장된 순서. 공개 시리즈 페이지와 같은 규칙으로 정렬한다.
  const baseline = useMemo(
    () =>
      sortSeriesPosts((posts ?? []).filter(post => post.seriesId === seriesId)).map(
        post => post.id
      ),
    [posts, seriesId]
  );

  // 로컬 편집 상태는 글 id의 순서 배열 하나다.
  // 기준선의 내용이 바뀔 때(처음 불러올 때, 저장 후 다시 받아올 때)만 로컬 상태를 기준선으로 맞춘다.
  // 참조가 아니라 내용(key)으로 비교해야, 같은 데이터를 다시 받아왔을 때 편집 중인 상태가 날아가지 않는다.
  const baselineKey = `${seriesId ?? idOrSlug}:${baseline.join('|')}`;
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  if (syncedKey !== baselineKey) {
    setSyncedKey(baselineKey);
    setOrder(baseline);
  }

  const [isSaving, setIsSaving] = useState(false);

  // posts에서 사라진 id는 화면·저장·변경 판정 모두에서 무시한다.
  const visibleOrder = useMemo(
    () => order.filter(id => postById.has(id)),
    [order, postById]
  );
  const isDirty = !isSameOrder(visibleOrder, baseline);
  const rows = visibleOrder
    .map(id => postById.get(id))
    .filter((post): post is Post => !!post);

  const updateOrder = (edit: (ids: string[]) => string[]) =>
    setOrder(prev => edit(prev.filter(id => postById.has(id))));

  const candidates = useMemo(() => {
    if (!series) return [];
    const inList = new Set(visibleOrder);
    return (posts ?? [])
      .filter(post => post.category === series.category && !inList.has(post.id))
      .sort(
        (a, b) =>
          parseDbTimestamp(getPostDate(b)).getTime() -
          parseDbTimestamp(getPostDate(a)).getTime()
      );
  }, [posts, series, visibleOrder]);

  const handleSave = async () => {
    if (!seriesId) return;
    setIsSaving(true);
    try {
      await updateSeriesPosts(seriesId, visibleOrder);
      // 글 목록(모든 카테고리·시리즈·미리보기)과 시리즈 목록이 함께 낡는다.
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      await queryClient.invalidateQueries({ queryKey: ['series'] });
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canAccessAdmin) return <></>;

  if (seriesLoading || postsLoading) {
    return (
      <>
        <PageReady />
        <div className="flex w-full flex-col items-center gap-4 py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-700"></div>
          <p className="text-sm text-neutral-500">시리즈를 불러오는 중입니다.</p>
        </div>
      </>
    );
  }

  if (seriesError || postsError) {
    return (
      <>
        <PageReady />
        <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-dashed border-neutral-300 py-20 text-neutral-500">
          <p>시리즈 정보를 불러오지 못했습니다.</p>
          <Button
            variant="outline"
            onClick={() => {
              void refetchSeries();
              void refetchPosts();
            }}>
            다시 시도
          </Button>
        </div>
      </>
    );
  }

  if (!series) {
    return (
      <>
        <PageReady />
        <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-dashed border-neutral-300 py-20 text-neutral-500">
          <p>시리즈를 찾을 수 없습니다.</p>
          <Button
            asChild
            variant="outline">
            <Link href="/admin/series">시리즈 목록으로</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageReady />
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/series"
          className="flex w-fit items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="size-4" />
          시리즈 목록
        </Link>

        <div className="flex items-start justify-between gap-4 max-sm:flex-col">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">
                {series.category}
              </span>
              <span className="text-neutral-400">글 {rows.length}건</span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-800">{series.title}</h1>
            {series.description && (
              <p className="mt-2 text-sm text-neutral-600">{series.description}</p>
            )}
          </div>
          <SeriesModal
            series={series}
            lockCategory={rows.length > 0}
            trigger={
              <Button variant="outline">
                <SquarePen />
                편집
              </Button>
            }
          />
        </div>

        <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
          <SeriesPostPicker
            candidates={candidates}
            seriesById={seriesById}
            currentSeriesId={series.id}
            onAdd={id => updateOrder(ids => appendItem(ids, id))}
            disabled={isSaving}
          />
          <div className="flex items-center gap-2 max-sm:justify-end">
            {isDirty && (
              <span className="text-xs text-amber-700">저장되지 않은 변경</span>
            )}
            <Button
              variant="outline"
              disabled={!isDirty || isSaving}
              onClick={() => setOrder(baseline)}>
              되돌리기
            </Button>
            <Button
              disabled={!isDirty || isSaving}
              onClick={handleSave}>
              {isSaving ? <LoaderCircle className="animate-spin" /> : '저장'}
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center text-neutral-500">
            이 시리즈에 글이 없습니다. &quot;글 추가&quot;로 넣으세요.
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {rows.map((post, index) => (
              <li
                key={post.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <span className="w-6 text-right text-sm text-neutral-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/editor?id=${post.id}`}
                    className="block truncate font-semibold hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    <span
                      className={
                        post.isPublished ? 'text-emerald-700' : 'text-amber-700'
                      }>
                      {post.isPublished ? '공개' : '비공개'}
                    </span>
                    {' · '}
                    {handleTimeStirng(getPostDate(post))}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${post.title} 위로`}
                    disabled={isSaving || index === 0}
                    onClick={() =>
                      updateOrder(ids => moveItem(ids, ids.indexOf(post.id), 'up'))
                    }>
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${post.title} 아래로`}
                    disabled={isSaving || index === rows.length - 1}
                    onClick={() =>
                      updateOrder(ids => moveItem(ids, ids.indexOf(post.id), 'down'))
                    }>
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${post.title} 시리즈에서 제거`}
                    disabled={isSaving}
                    onClick={() => updateOrder(ids => removeItem(ids, post.id))}>
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
