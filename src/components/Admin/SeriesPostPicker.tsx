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
  onAdd
}: {
  candidates: Post[];
  seriesById: Map<string, Series>;
  onAdd: (postId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus />
          글 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[560px]">
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
          <ul className="flex flex-col divide-y">
            {candidates.map(post => {
              const otherSeries = post.seriesId
                ? seriesById.get(post.seriesId)
                : undefined;
              return (
                <li
                  key={post.id}
                  className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{post.title}</p>
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
