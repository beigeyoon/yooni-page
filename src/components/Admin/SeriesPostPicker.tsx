'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Post, Series } from '@/types';
import handleTimeStirng from '@/utils/handleTimeStirng';
import { getPostDate } from '@/utils/postDate';

// 후보는 부모가 이미 걸러서 넘긴다(같은 카테고리, 목록에 없는 글, 게시일 내림차순).
// 추가해도 대화상자를 닫지 않아 여러 개를 이어서 넣을 수 있다.
export default function SeriesPostPicker({
  candidates,
  seriesById,
  currentSeriesId,
  onAdd,
  disabled
}: {
  candidates: Post[];
  seriesById: Map<string, Series>;
  currentSeriesId?: string;
  onAdd: (postId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}>
          <Plus />
          글 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>글 추가</DialogTitle>
          <DialogDescription>
            같은 카테고리의 글만 보입니다. 추가한 글은 목록 맨 끝에 붙습니다.
          </DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            추가할 수 있는 글이 없습니다.
          </p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col divide-y overflow-y-auto">
            {candidates.map(post => {
              const otherSeries =
                post.seriesId && post.seriesId !== currentSeriesId
                  ? seriesById.get(post.seriesId)
                  : undefined;
              return (
                <li
                  key={post.id}
                  className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate font-medium"
                      title={post.title}>
                      {post.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      <span
                        className={
                          post.isPublished ? 'text-emerald-700' : 'text-amber-700'
                        }>
                        {post.isPublished ? '공개' : '비공개'}
                      </span>
                      {' · '}
                      {handleTimeStirng(getPostDate(post))}
                      {otherSeries && <> · 다른 시리즈: {otherSeries.title}</>}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    aria-label={`${post.title} 추가`}
                    onClick={() => onAdd(post.id)}>
                    추가
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
