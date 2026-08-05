import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Category, Series } from '@/types';

export default function SeriesFilter({
  category,
  series
}: {
  category: Category;
  series: Series[];
}) {
  if (series.length === 0) return null;

  return (
    <div className="mx-4 mb-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 w-1.5 rounded-full bg-neutral-300"></div>
        <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Series
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {series.map(item => (
          <Button
            key={item.id}
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900">
            <Link href={`/${category}/series/${item.slug}`}>{item.title}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
