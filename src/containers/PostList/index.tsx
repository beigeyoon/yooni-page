'use client';

import { PostPreview } from '@/components/PostPreview';
import { getPosts, getPostsBySeries } from '@/lib/api/posts';
import { getSeries } from '@/lib/api/series';
import { Series } from '@/types';
import { Category, Post } from '@/types';
import getPostsList from '@/utils/getPostsList';
import { useQuery } from '@tanstack/react-query';
import { FileWarning } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';
import PhotoPreview from '@/components/PhotoPreview';
import { Button } from '@/components/ui/button';

const PostList = ({
  category,
  seriesId
}: {
  category: Category;
  seriesId?: string;
}) => {
  const router = useRouteWithLoading();
  const { isAdmin } = useAuth();

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: seriesId ? ['posts', seriesId] : ['posts', category],
    queryFn: () => (seriesId ? getPostsBySeries(seriesId) : getPosts(category)),
    select: (data: { data: Post[] }) => {
      const postsData = data.data;
      return getPostsList(postsData, category);
    }
  });

  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries,
    select: (data: { data: Series[] }) => {
      return data.data;
    }
  });

  // 현재 카테고리에 해당하는 시리즈들 필터링 (시리즈 페이지가 아닐 때만)
  const seriesByCategory = useMemo(() => {
    if (seriesId) return []; // 시리즈 페이지에서는 시리즈 버튼 숨김
    const seriesList = seriesData || [];
    if (!Array.isArray(seriesList)) return [];
    const filtered = seriesList.filter(
      (series: Series) => series.category === category
    );
    return filtered;
  }, [seriesData, category, seriesId]);

  // 현재 시리즈 정보 (시리즈 페이지일 때만)
  const selectedSeriesInfo = useMemo(() => {
    if (!seriesId) return null;
    const seriesList = seriesData || [];
    return seriesList.find((series: Series) => series.id === seriesId);
  }, [seriesData, seriesId]);

  const handlePostClick = (id: string) => {
    router.push(`/${category}/${id}`);
  };

  const handleSeriesClick = (seriesId: string) => {
    router.push(`/${category}/series/${seriesId}`);
  };

  const posts = useMemo(
    () => (isAdmin ? postsData : postsData?.filter(post => post.isPublished)),
    [postsData, isAdmin]
  );

  if (postsLoading || seriesLoading) {
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
    <div className="mx-auto flex max-w-[780px] flex-col pt-8">
      {/* 시리즈 페이지일 때 시리즈 정보 표시 */}
      {seriesId && selectedSeriesInfo && (
        <div className="mb-8 rounded-lg bg-gradient-to-r from-neutral-50 to-neutral-100 p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-neutral-400"></div>
            <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Series
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-neutral-800">
            {selectedSeriesInfo.title}
          </h1>
          {selectedSeriesInfo.description && (
            <p className="leading-relaxed text-neutral-600">
              {selectedSeriesInfo.description}
            </p>
          )}
        </div>
      )}

      {/* 시리즈 필터링 버튼들 (일반 페이지에서만) */}
      {!seriesId && seriesByCategory.length > 0 && (
        <div className="mx-4 mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-neutral-300"></div>
            <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Series
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {seriesByCategory.map((series: Series) => (
              <Button
                key={series.id}
                variant="outline"
                size="sm"
                onClick={() => handleSeriesClick(series.id)}
                className="rounded-full border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900">
                {series.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 포스트 목록 */}
      <div className="flex flex-col-reverse justify-center">
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
              />
            );
        })}
      </div>
    </div>
  );
};

export default PostList;
