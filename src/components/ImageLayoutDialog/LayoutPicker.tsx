import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import {
  LAYOUT_COUNTS,
  getLayoutsByCount,
  type LayoutCount
} from '@/utils/imageLayouts';

interface Props {
  count: LayoutCount;
  layoutId: string;
  disabled: boolean;
  onCountChange: (count: LayoutCount) => void;
  onLayoutChange: (id: string) => void;
}

export default function LayoutPicker({
  count,
  layoutId,
  disabled,
  onCountChange,
  onLayoutChange
}: Props) {
  const layouts = getLayoutsByCount(count);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {LAYOUT_COUNTS.map(n => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={n === count ? 'default' : 'outline'}
            disabled={disabled}
            onClick={() => onCountChange(n)}>
            {n}장
          </Button>
        ))}
      </div>
      {/* 고를 레이아웃이 하나뿐이면(1장) 썸네일을 보여주지 않는다. */}
      {layouts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {layouts.map(layout => (
            <button
              key={layout.id}
              type="button"
              title={layout.label}
              aria-label={layout.label}
              aria-pressed={layout.id === layoutId}
              disabled={disabled}
              onClick={() => onLayoutChange(layout.id)}
              className={cn(
                'w-20 rounded border p-1',
                layout.id === layoutId
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-neutral-200 hover:border-neutral-400'
              )}>
              <div
                className="image-album image-album--thumb"
                data-layout={layout.id}>
                {layout.cells.map((_, i) => (
                  <span
                    key={i}
                    className="rounded-sm bg-neutral-300"
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
