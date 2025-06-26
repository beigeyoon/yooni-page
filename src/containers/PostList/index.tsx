'use client';

import { PostPreview } from '@/components/PostPreview';
import { getPosts } from '@/lib/api/posts';
import { Category, Post } from '@/types';
import getPostsList from '@/utils/getPostsList';
import { useQuery } from '@tanstack/react-query';
import { FileWarning } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';
import PhotoPreview from '@/components/PhotoPreview';

const PostList = ({ category }: { category: Category }) => {
  const router = useRouteWithLoading();
  const { isAdmin } = useAuth();

  const { data: postsData } = useQuery({
    queryKey: ['posts', category],
    queryFn: () => getPosts(category),
    select: data => {
      const postsData = data?.data as Post[];
      return getPostsList(postsData, category);
    }
  });

  const handlePostClick = (id: string) => {
    router.push(`/${category}/${id}`);
  };

  const handlePhotoPostClick = () => {};

  const posts = useMemo(
    () => (isAdmin ? postsData : postsData?.filter(post => post.isPublished)),
    [postsData, isAdmin]
  );

  if (!posts || posts.length === 0) {
    return (
      <div className="flex w-full flex-col items-center gap-4 pt-10">
        <FileWarning width={48} />
        작성된 포스트가 없습니다.
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-[900px] flex-col-reverse justify-center pt-8">
      {posts?.map(post => {
        if (category !== 'photo') {
          return (
            <PostPreview
              key={post.id}
              post={post}
              onClick={() => handlePostClick(post.id)}
            />
          );
        } else
          return (
            <PhotoPreview
              key={post.id}
              post={post}
              onClick={() => handlePhotoPostClick()}
            />
          );
      })}
    </div>
  );
};

export default PostList;
