'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Post } from '@/types';
import handleTimeStirng from '@/utils/handleTimeStirng';
import { useMemo } from 'react';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';

export function RecentPosts({
  category,
  posts
}: {
  category: string;
  posts: Post[];
}) {
  const router = useRouteWithLoading();

  const onClickPost = (id: string) => {
    router.push(`/${category}/${id}`);
  };

  const categoryInKorean = (category: string) => {
    switch (category) {
      case 'dev':
        return '개발';
      case 'travel':
        return '여행';
      case 'talk':
        return '얘기';
      default:
        return '';
    }
  };

  const filteredPosts = useMemo(
    () => posts?.filter(post => post.isPublished),
    [posts]
  );

  return (
    <Table>
      <TableHeader className="border-b border-b-zinc-400">
        <TableRow className="border-none hover:bg-transparent">
          <TableHead className="border-none text-[16px] hover:bg-transparent">
            {categoryInKorean(category)}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredPosts?.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={2}
              className="py-6 text-center hover:bg-transparent">
              최근 포스트가 없습니다.
            </TableCell>
          </TableRow>
        )}
        {filteredPosts?.map(post => (
          <TableRow
            key={post.id}
            className="flex w-full cursor-pointer justify-between hover:bg-zinc-100"
            onClick={() => onClickPost(post.id)}>
            <TableCell className="overflow-hidden truncate whitespace-nowrap font-semibold md:max-w-[170px]">
              {post.title}
            </TableCell>
            <TableCell className="text-[10px] sm:min-w-[80px]">
              {handleTimeStirng(post.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
