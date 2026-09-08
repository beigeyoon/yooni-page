'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileWarning, LoaderCircle, Plus, SquarePen, Trash2 } from 'lucide-react';
import PageReady from '@/components/Loading/PageReady';
import SeriesModal from '@/components/SeriesModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useAdminGate } from '@/hooks/useAdminGate';
import { getAllPostsForPreview } from '@/lib/api/posts';
import { deleteSeries, getSeries } from '@/lib/api/series';
import { Post, Series } from '@/types';
import { formatDisplayDate } from '@/utils/dbTimestamp';

const CATEGORY_ORDER = ['dev', 'travel', 'talk', 'photo'];

// 카테고리 순, 그 안에서 제목 가나다순.
function sortSeries(list: Series[]): Series[] {
  return [...list].sort((a, b) => {
    const byCategory =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    return byCategory !== 0 ? byCategory : a.title.localeCompare(b.title, 'ko');
  });
}

function DeleteSeriesButton({
  series,
  memberCount
}: {
  series: Series;
  memberCount: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const helperId = useId();
  const blocked = memberCount === null || memberCount > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSeries(series.id);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['series'] });
    } catch (error) {
      alert(error instanceof Error ? error.message : '시리즈 삭제에 실패했습니다.');
      await queryClient.invalidateQueries({ queryKey: ['posts', 'preview', 'all'] });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={blocked}
            aria-describedby={blocked ? helperId : undefined}>
            <Trash2 />
            삭제
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>시리즈 삭제</DialogTitle>
            <DialogDescription>
              &quot;{series.title}&quot; 시리즈를 삭제합니다. 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}>
              {isDeleting ? <LoaderCircle className="animate-spin" /> : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {blocked && (
        <span
          id={helperId}
          className="text-xs text-neutral-500">
          {memberCount === null
            ? '글 수를 확인하지 못했습니다.'
            : `글 ${memberCount}건. 먼저 빼야 삭제할 수 있습니다.`}
        </span>
      )}
    </div>
  );
}

export default function AdminSeriesList() {
  const { canAccessAdmin } = useAdminGate();

  const { data: seriesList, isLoading: seriesLoading } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries,
    enabled: canAccessAdmin,
    select: (data: { data: Series[] }) => sortSeries(data.data)
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'preview', 'all'],
    queryFn: getAllPostsForPreview,
    enabled: canAccessAdmin,
    select: (data: { data: Post[] }) => data.data
  });

  // 시리즈별 글 수. 초안도 센다.
  const countBySeries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts ?? []) {
      if (!post.seriesId) continue;
      counts.set(post.seriesId, (counts.get(post.seriesId) ?? 0) + 1);
    }
    return counts;
  }, [posts]);

  if (!canAccessAdmin) return <></>;

  const isLoading = seriesLoading || postsLoading;

  return (
    <>
      <PageReady />
      <div className="flex items-center justify-between gap-4 pb-4 max-sm:flex-col max-sm:items-start">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">시리즈 관리</h1>
          <p className="mt-2 text-sm text-neutral-500">
            시리즈를 만들고 고치고, 상세에서 소속 글과 순서를 편집합니다.
          </p>
        </div>
        <SeriesModal
          trigger={
            <Button>
              <Plus />
              새 시리즈
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className="flex w-full flex-col items-center gap-4 py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-700"></div>
          <p className="text-sm text-neutral-500">시리즈를 불러오는 중입니다.</p>
        </div>
      ) : !seriesList || seriesList.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-dashed border-neutral-300 py-20 text-neutral-500">
          <FileWarning width={40} />
          <p>시리즈가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead className="text-right">글 수</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">동작</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seriesList.map(series => {
                const count = countBySeries.get(series.id) ?? 0;
                return (
                  <TableRow key={series.id}>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/admin/series/${series.id}`}
                        className="hover:underline">
                        {series.title}
                      </Link>
                    </TableCell>
                    <TableCell>{series.category}</TableCell>
                    <TableCell className="text-right">{posts ? count : '—'}</TableCell>
                    <TableCell>{formatDisplayDate(series.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-start justify-end gap-2">
                        <SeriesModal
                          series={series}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm">
                              <SquarePen />
                              편집
                            </Button>
                          }
                        />
                        <DeleteSeriesButton
                          series={series}
                          memberCount={posts ? count : null}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
