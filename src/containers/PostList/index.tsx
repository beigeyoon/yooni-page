'use client';

import { PostPreview } from '@/components/PostPreview';
import { getPosts, getPostsBySeries } from '@/lib/api/posts';
import { Category, Post } from '@/types';
import getPostsList from '@/utils/getPostsList';
import { useQuery } from '@tanstack/react-query';
import { FileWarning } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import PhotoPreview from '@/components/PhotoPreview';

const PostList = ({
  category,
  seriesId
}: {
  category: Category;
  seriesId?: string;
}) => {
  const { isAdmin } = useAuth();

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: seriesId ? ['posts', seriesId] : ['posts', category],
    queryFn: () => (seriesId ? getPostsBySeries(seriesId) : getPosts(category)),
    select: (data: { data: Post[] }) => {
      const postsData = data.data;
      return getPostsList(postsData, category);
    }
  });

  const posts = useMemo(
    () => (isAdmin ? postsData : postsData?.filter(post => post.isPublished)),
    [postsData, isAdmin]
  );

  if (postsLoading) {
    return (
      <div className="flex w-full flex-col items-center gap-4 pt-10">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-700"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex w-full flex-col items-center gap-4 pt-10">
        <FileWarning width={48} />
        {seriesId
          ? '해당 시리즈의 포스트가 없습니다.'
          : '작성된 포스트가 없습니다.'}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[780px] flex-col">
      {/* 포스트 목록 */}
      <div className="flex flex-col justify-center">
        {posts?.map(post => {
          if (category !== 'photo') {
            return (
              <PostPreview
                key={post.id}
                post={post}
                href={`/${category}/${post.slug}`}
              />
            );
          } else
            return (
              <PhotoPreview
                key={post.id}
                post={post}
              />
            );
        })}
      </div>
    </div>
  );
};

export default PostList;
