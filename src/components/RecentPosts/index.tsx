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
        return '잡담';
      default:
        return '';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b-zinc-400 hover:bg-transparent">
          <TableHead className="text-[16px] hover:bg-transparent">
            {categoryInKorean(category)}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts?.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={2}
              className="py-6 text-center hover:bg-transparent">
              최근 포스트가 없습니다.
            </TableCell>
          </TableRow>
        )}
        {posts?.map(post => (
          <TableRow
            key={post.id}
            className="cursor-pointer"
            onClick={() => onClickPost(post.id)}>
            <TableCell className="font-semibold">{post.title}</TableCell>
            <TableCell className="text-right">
              {handleTimeStirng(post.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
