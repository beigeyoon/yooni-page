'use client';

import { useQuery } from '@tanstack/react-query';
import { getSeries } from '@/lib/api/series';
import { Series } from '@/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SeriesGroup = () => {
  const router = useRouter();

  const { data: seriesData, isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries,
    select: (data: { data: Series[] }) => data.data
  });

  const handleSeriesClick = (series: Series) => {
    router.push(`/${series.category}/series/${series.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-neutral-500">시리즈를 불러오는 중...</div>
      </div>
    );
  }

  if (!seriesData || seriesData.length === 0) {
    return null;
  }

  // 카테고리별로 시리즈 그룹화
  const seriesByCategory = seriesData.reduce((acc, series) => {
    if (!acc[series.category]) {
      acc[series.category] = [];
    }
    acc[series.category].push(series);
    return acc;
  }, {} as Record<string, Series[]>);

  // 카테고리 이름 매핑과 순서 정의
  const categoryOrder = ['dev', 'travel', 'talk', 'photo'];
  const categoryNames: Record<string, string> = {
    dev: '개발',
    travel: '여행',
    talk: '이야기',
    photo: '사진'
  };

  return (
    <section className="px-12 pb-12 max-sm:px-6">
      <h2 className="pb-4 text-2xl font-bold text-neutral-800">
        <BookOpen className="inline-block mr-2" />
        시리즈
      </h2>
      <TooltipProvider delayDuration={0}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categoryOrder
            .filter(category => seriesByCategory[category] && seriesByCategory[category].length > 0)
            .map((category) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-neutral-400"></div>
                  <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                    {categoryNames[category]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {seriesByCategory[category].map((seriesItem) => (
                    <Tooltip key={seriesItem.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSeriesClick(seriesItem)}
                          className="rounded-full border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                        >
                          {seriesItem.title}
                        </Button>
                      </TooltipTrigger>
                      {seriesItem.description && (
                        <TooltipContent
                          className="bg-neutral-900 p-2 max-sm:hidden"
                          side="bottom">
                          <span className="text-xs text-white">{seriesItem.description}</span>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </TooltipProvider>
    </section>
  );
};

export default SeriesGroup;
