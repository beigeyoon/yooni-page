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
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export function RecentPosts({
  category,
  posts
}: {
  category: string;
  posts: Post[];
}) {
  const router = useRouter();

  const onClickPost = (id: string) => {
    router.push(`/${category}/${id}`);
  };

  const categoryInKorean = (category: string) => {
    switch (category) {
      case 'devs':
        return '개발';
      case 'travels':
        return '여행';
      case 'talks':
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
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className="text-[16px] hover:bg-transparent border-none">
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
            className="cursor-pointer hover:bg-zinc-100"
            onClick={() => onClickPost(post.id)}>
            <TableCell className="font-semibold">{post.title}</TableCell>
            <TableCell className="min-w-[88px] text-right text-xs">
              {handleTimeStirng(post.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
